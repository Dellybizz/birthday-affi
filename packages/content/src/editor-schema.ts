export type SettingType="text"|"textarea"|"color"|"range"|"select"|"toggle"|"media"|"spacing"|"font";
export type SettingDefinition={key:string;label:string;type:SettingType;min?:number;max?:number;step?:number;options?:{label:string;value:string}[]};
export const commonDesignSettings:SettingDefinition[]=[
{key:"background",label:"Background",type:"color"},
{key:"padding",label:"Padding",type:"range",min:0,max:96},
{key:"margin",label:"Margin",type:"range",min:0,max:96},
{key:"radius",label:"Corner radius",type:"range",min:0,max:64},
{key:"opacity",label:"Opacity",type:"range",min:0,max:100},
{key:"animation",label:"Animation",type:"select",options:[{label:"None",value:"none"},{label:"Fade",value:"fade"},{label:"Rise",value:"rise"},{label:"Scale",value:"scale"}]},
{key:"visible",label:"Visible",type:"toggle"}
];
export const textSettings:SettingDefinition[]=[
{key:"text",label:"Text",type:"textarea"},
{key:"size",label:"Font size",type:"range",min:10,max:72},
{key:"weight",label:"Weight",type:"select",options:[{label:"Regular",value:"400"},{label:"Medium",value:"500"},{label:"Semibold",value:"600"},{label:"Bold",value:"700"}]},
{key:"align",label:"Alignment",type:"select",options:[{label:"Left",value:"left"},{label:"Center",value:"center"},{label:"Right",value:"right"}]}
];
