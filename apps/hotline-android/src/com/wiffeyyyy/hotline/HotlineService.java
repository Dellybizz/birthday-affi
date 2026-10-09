package com.wiffeyyyy.hotline;
import android.app.*;
import android.content.*;
import android.content.pm.ServiceInfo;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.os.*;
import org.json.JSONObject;
import java.util.concurrent.*;

/** Explicitly armed foreground receiver. No hidden restart or auto-answer. */
public class HotlineService extends Service {
 static final String STOP="stop", DECLINE="decline", MIC="microphone";
 static final int MONITOR=10, INCOMING=11;
 ScheduledExecutorService worker;
 NotificationManager notifications;
 PowerManager.WakeLock wake;
 volatile boolean alive;
 String ringing="", suppressed="";
 boolean microphone;
 String lastStatus="";
 void updateStatus(String text){if(alive&&!text.equals(lastStatus)){lastStatus=text;notifications.notify(MONITOR,monitor(text));}}
 @Override public void onCreate(){super.onCreate();notifications=getSystemService(NotificationManager.class);
  NotificationChannel monitor=new NotificationChannel("receiver","Receiver status",NotificationManager.IMPORTANCE_LOW);notifications.createNotificationChannel(monitor);
  NotificationChannel calls=new NotificationChannel("calls","Incoming Hotline calls",NotificationManager.IMPORTANCE_HIGH);
  calls.setDescription("Incoming calls while receiver is enabled");calls.enableVibration(true);calls.setVibrationPattern(new long[]{0,600,600,600});
  calls.setSound(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE),new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE).build());notifications.createNotificationChannel(calls);
 }
 @Override public int onStartCommand(Intent intent,int flags,int startId){
  String action=intent==null?"":intent.getAction();
  if(STOP.equals(action)){Config.prefs(this).edit().putBoolean("armed",false).apply();stopSelf();return START_NOT_STICKY;}
  if(!Config.prefs(this).getBoolean("armed",false)||Config.key(this).isEmpty()){stopSelf();return START_NOT_STICKY;}
  if(MIC.equals(action))microphone=true;lastStatus="";
  if(Build.VERSION.SDK_INT>=34)startForeground(MONITOR,monitor("Connecting…"),ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE|(microphone?ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE:0));else startForeground(MONITOR,monitor("Connecting…"));
  if(worker==null){alive=true;wake=((PowerManager)getSystemService(POWER_SERVICE)).newWakeLock(PowerManager.PARTIAL_WAKE_LOCK,"Hotline:receiver");wake.acquire();worker=Executors.newSingleThreadScheduledExecutor();worker.scheduleWithFixedDelay(this::poll,0,300,TimeUnit.MILLISECONDS);}
  if(DECLINE.equals(action)){final String id=intent.getStringExtra("callId");suppressed=id;notifications.cancel(INCOMING);worker.execute(()->{try{Config.exchange(this,"end",new JSONObject().put("callId",id));}catch(Exception e){notifications.notify(MONITOR,monitor("Decline failed. Check call screen."));}});}
  return START_STICKY;
 }
 Notification monitor(String text){PendingIntent open=PendingIntent.getActivity(this,0,new Intent(this,MainActivity.class),PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);PendingIntent stop=PendingIntent.getService(this,1,new Intent(this,HotlineService.class).setAction(STOP),PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);return new Notification.Builder(this,"receiver").setSmallIcon(R.drawable.hotline).setContentTitle("Hotline receiver enabled").setContentText(text).setContentIntent(open).setOngoing(true).addAction(new Notification.Action.Builder(null,"Stop receiving",stop).build()).build();}
 void poll(){if(!alive)return;try{
  JSONObject state=Config.exchange(this,"status",new JSONObject());if(!alive)return;
  String id=state.optString("callId","");String phase=state.optString("state","");
  if("ringing".equals(phase)&&!id.isEmpty()&&!"null".equals(id)){
   if(!id.equals(ringing)){ringing=id;if(!id.equals(suppressed))showCall(id);}
  }else{if(!ringing.isEmpty()){notifications.cancel(INCOMING);ringing="";}}
  updateStatus("connected".equals(phase)?"Call active · open call screen":"Online · ready for calls");
 }catch(SecurityException e){notifications.notify(MONITOR,monitor("Receiver access replaced. Install the latest APK."));Config.prefs(this).edit().putBoolean("armed",false).apply();stopSelf();}catch(Exception e){updateStatus("Offline · retrying connection");}}
 void showCall(String id){Intent incoming=new Intent(this,IncomingActivity.class).putExtra("callId",id);PendingIntent full=PendingIntent.getActivity(this,2,incoming,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);PendingIntent answer=PendingIntent.getActivity(this,3,new Intent(this,MainActivity.class).putExtra("answer",true).putExtra("callId",id),PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);PendingIntent decline=PendingIntent.getService(this,4,new Intent(this,HotlineService.class).setAction(DECLINE).putExtra("callId",id),PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
  Config.prefs(this).edit().putString("lastCall",new java.text.SimpleDateFormat("EEE, d MMM · HH:mm",java.util.Locale.getDefault()).format(new java.util.Date())).apply();
  Notification.Builder builder=new Notification.Builder(this,"calls").setSmallIcon(R.drawable.hotline).setContentTitle("Incoming Hotline call ♡").setContentText("Tap Answer to connect").setCategory(Notification.CATEGORY_CALL).setContentIntent(full).setFullScreenIntent(full,true).setOngoing(true).setTimeoutAfter(60000).setOnlyAlertOnce(true);
  if(Build.VERSION.SDK_INT>=31)builder.setStyle(Notification.CallStyle.forIncomingCall(new Person.Builder().setName("Sara").setImportant(true).build(),decline,answer));else builder.addAction(new Notification.Action.Builder(null,"Decline",decline).build()).addAction(new Notification.Action.Builder(null,"Answer",answer).build());
  Notification notification=builder.build();notification.flags|=Notification.FLAG_INSISTENT;notifications.notify(INCOMING,notification);
 }
 @Override public void onDestroy(){alive=false;if(worker!=null)worker.shutdownNow();if(wake!=null&&wake.isHeld())wake.release();notifications.cancel(INCOMING);super.onDestroy();}
 @Override public IBinder onBind(Intent intent){return null;}
}
