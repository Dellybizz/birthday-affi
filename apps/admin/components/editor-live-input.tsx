'use client';
import {useEffect,useState,type ComponentProps} from 'react';

// Keep incomplete numbers/colours editable without remounting the focused field.
// Valid edits reach the document immediately; undo/reset resynchronizes the value.
export function LiveInput({value,onChange,...props}:ComponentProps<'input'>){
 const [draft,setDraft]=useState(value??'');
 useEffect(()=>{setDraft(value??'')},[value]);
 return <input {...props} value={draft} onChange={event=>{setDraft(event.target.value);onChange?.(event)}}/>;
}
export function LiveTextarea({value,onChange,...props}:ComponentProps<'textarea'>){
 const [draft,setDraft]=useState(value??'');
 useEffect(()=>{setDraft(value??'')},[value]);
 return <textarea {...props} value={draft} onChange={event=>{setDraft(event.target.value);onChange?.(event)}}/>;
}
