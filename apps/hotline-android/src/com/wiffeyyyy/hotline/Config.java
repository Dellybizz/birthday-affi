package com.wiffeyyyy.hotline;
import android.content.Context;
import android.net.Uri;
import org.json.JSONObject;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.io.ByteArrayOutputStream;
public final class Config {
 public static final String ORIGIN="https://wiffeyyyy-os.vercel.app";
 static android.content.SharedPreferences prefs(Context c){return c.getSharedPreferences("receiver",Context.MODE_PRIVATE);}
 static String key(Context c){return Provisioning.KEY;}
 static String parseKey(String value){String raw=value.trim();if(raw.matches("[a-f0-9]{64}"))return raw;Uri u=Uri.parse(raw);if(!"https".equals(u.getScheme())||!"wiffeyyyy-os.vercel.app".equals(u.getHost())||!"/hotline/receive".equals(u.getPath()))return "";String fragment=u.getFragment();if(fragment==null)return "";String token=Uri.parse("https://local/?"+fragment).getQueryParameter("key");return token!=null&&token.matches("[a-f0-9]{64}")?token:"";}
 static JSONObject exchange(Context c,String action,JSONObject payload)throws Exception {
  String token=key(c);if(token.isEmpty())throw new Exception("This build is not configured. Install your personal receiver APK.");
  HttpURLConnection con=(HttpURLConnection)new URL(ORIGIN+"/api/hotline").openConnection();con.setConnectTimeout(5000);con.setReadTimeout(8000);con.setInstanceFollowRedirects(false);con.setRequestMethod("POST");con.setRequestProperty("Content-Type","application/json");con.setDoOutput(true);
  byte[] body=new JSONObject().put("token",token).put("action",action).put("payload",payload).toString().getBytes(StandardCharsets.UTF_8);
  try{try(java.io.OutputStream output=con.getOutputStream()){output.write(body);}int status=con.getResponseCode();if(status==403)throw new SecurityException("Receiver access was replaced. Install the latest personal APK.");if(status!=200)throw new Exception("Call service temporarily unavailable.");ByteArrayOutputStream out=new ByteArrayOutputStream();byte[] buffer=new byte[4096];try(java.io.InputStream input=con.getInputStream()){int n;while((n=input.read(buffer))!=-1){out.write(buffer,0,n);if(out.size()>200000)throw new Exception("Call response too large.");}}JSONObject result=new JSONObject(out.toString("UTF-8"));if(!"receiver".equals(result.optString("role")))throw new SecurityException("Use the receiver link, not the caller link.");return result;}catch(Exception error){con.disconnect();throw error;}
 }
}
