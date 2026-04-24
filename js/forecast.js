// forecast.js

let currentMode = "mean";
let activeLayer = null;
let geoLayer = null;
let dailyChart = null;
let hourlyChart = null;

/* =========================
   CLOCK
========================= */
function updateClock(){
document.getElementById("datetime").innerHTML =
new Date().toLocaleString();
}
updateClock();
setInterval(updateClock,30000);

/* =========================
   REGION DATA + BASELINES
========================= */
const regionData = {

"Ashanti Region":{
coords:[6.69,-1.62],
mean:28.8,max:34.3,min:23.9
},

"Greater Accra Region":{
coords:[5.56,-0.20],
mean:29.4,max:33.5,min:25.7
},

"Northern Region":{
coords:[9.40,-0.84],
mean:32.25,max:38.7,min:26.5
},

"Western Region":{
coords:[4.93,-1.75],
mean:28.5,max:32.2,min:25.0
},

"Eastern Region":{
coords:[6.09,-0.26],
mean:29.0,max:35.0,min:23.9
},

"Bono Region":{
coords:[7.33,-2.33],
mean:28.55,max:34.8,min:23.3
},

"Central Region":{
coords:[5.11,-1.25],
mean:28.25,max:31.8,min:25.5
},

"Volta Region":{
coords:[6.60,0.47],
mean:29.8,max:35.5,min:24.69
},

"Upper East Region":{
coords:[10.79,-0.85],
mean:33.05,max:40.0,min:26.7
},

"Upper West Region":{
coords:[10.06,-2.51],
mean:31.65,max:38.0,min:26.0
},

"Oti Region":{
coords:[8.07,0.17],
mean:30.85,max:36.1,min:26.1
},

"Bono East Region":{
coords:[7.59,-1.94],
mean:28.9,max:35.0,min:23.45
},

"Ahafo Region":{
coords:[6.80,-2.52],
mean:28.55,max:34.8,min:23.3
},

"North East Region":{
coords:[10.53,-0.37],
mean:32.25,max:38.7,min:26.5
},

"Savannah Region":{
coords:[9.08,-1.82],
mean:30.1,max:37.3,min:24.2
},

"Western North Region":{
coords:[6.20,-2.48],
mean:29.65,max:35.5,min:24.4
}

};

/* =========================
   MODE SWITCH
========================= */
function setMode(mode,el){

currentMode = mode;

document.querySelectorAll(".tab")
.forEach(t=>t.classList.remove("active"));

el.classList.add("active");

if(window.currentRegion){
loadRegion(window.currentRegion);
}

}

/* =========================
   MAP
========================= */
const map = L.map("map",{zoomControl:false});
L.control.zoom({position:"bottomright"}).addTo(map);

fetch("data/geoBoundaries-GHA-ADM1_simplified.geojson")
.then(r=>r.json())
.then(data=>{

geoLayer = L.geoJSON(data,{

style:()=>{
return{
color:"#ffffff",
weight:1.2,
fillColor:"#1f2937",
fillOpacity:.42
};
},

onEachFeature:(feature,layer)=>{

let region = feature.properties.shapeName;

layer.bindTooltip(region);

layer.on("mouseover",()=>{
if(layer !== activeLayer){
layer.setStyle({
weight:2,
fillOpacity:.65
});
}
});

layer.on("mouseout",()=>{
if(layer !== activeLayer){
geoLayer.resetStyle(layer);
}
});

layer.on("click",()=>{

if(activeLayer){
geoLayer.resetStyle(activeLayer);
}

activeLayer = layer;
window.currentRegion = region;

loadRegion(region);

});

}

}).addTo(map);

map.fitBounds(geoLayer.getBounds());

});

/* =========================
   LOAD REGION
========================= */
async function loadRegion(region){

document.getElementById("panelDefault")
.classList.add("hidden");

document.getElementById("contentPanel")
.classList.remove("hidden");

document.getElementById("regionName")
.innerHTML = region;

let info = regionData[region];

if(!info) return;

let lat = info.coords[0];
let lon = info.coords[1];

let baseline = info[currentMode];

let variable = {
mean:"temperature_2m_mean",
max:"temperature_2m_max",
min:"temperature_2m_min"
}[currentMode];

let label = {
mean:"Mean Temp °C",
max:"Max Temp °C",
min:"Min Temp °C"
}[currentMode];

document.getElementById("dailyTitle").innerHTML =
"📊 5-Day Forecast ("+label+")";

document.getElementById("hourlyTitle").innerHTML =
"🕒 Today's Hourly Mean Heat Curve";

let url =
`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=${variable}&hourly=temperature_2m&timezone=auto`;

let res = await fetch(url);
let data = await res.json();

let forecast = data.daily[variable][0];
let delta = +(forecast - baseline).toFixed(2);

let risk = getRisk(delta);

renderCard(region,baseline,forecast,delta,risk);

if(activeLayer){
activeLayer.setStyle({
fillColor:getRiskColor(risk),
fillOpacity:.82,
weight:2.5
});
}

drawDaily(data,variable,baseline,label);
drawHourly(data,baseline);

}

/* =========================
   RISK LOGIC
========================= */
function getRisk(delta){

if(delta <= 1) return "Safe";
if(delta <= 2) return "Caution";
if(delta <= 3) return "Extreme Caution";
if(delta <= 4) return "Danger";
return "Extreme Danger";

}

function getRiskColor(risk){

return{
"Safe":"#22c55e",
"Caution":"#eab308",
"Extreme Caution":"#f97316",
"Danger":"#dc2626",
"Extreme Danger":"#7f1d1d"
}[risk];

}

function healthText(risk){

return{
"Safe":"No significant heat stress.",
"Caution":"Mild fatigue possible.",
"Extreme Caution":"Heat exhaustion signs possible.",
"Danger":"Heat exhaustion likely.",
"Extreme Danger":"Heat stroke highly likely."
}[risk];

}

function adviceText(risk){

return{
"Safe":"Normal activity.",
"Caution":"Stay hydrated.",
"Extreme Caution":"Avoid midday heat.",
"Danger":"Limit outdoor work.",
"Extreme Danger":"Stay indoors."
}[risk];

}

/* =========================
   CARD
========================= */
function renderCard(region,baseline,forecast,delta,risk){

document.getElementById("baseline").innerHTML =
baseline;

document.getElementById("forecast").innerHTML =
forecast.toFixed(2);

document.getElementById("deltaText").innerHTML =
"Excess Heat: "+delta+" °C";

let badge = document.getElementById("riskBadge");

badge.innerHTML = risk;

badge.className =
"risk-badge risk-" +
risk.toLowerCase().replace(/\s/g,"-");

document.getElementById("health").innerHTML =
healthText(risk);

document.getElementById("advice").innerHTML =
adviceText(risk);

document.getElementById("fillBar").style.width =
Math.min(Math.max(delta,0)*20,100)+"%";

}

/* =========================
   DAILY CHART
========================= */
function drawDaily(data,varName,baseline,label){

if(dailyChart) dailyChart.destroy();

dailyChart = new Chart(
document.getElementById("dailyChart"),
{
type:"line",

data:{
labels:data.daily.time.slice(0,5).map(v=>
new Date(v).toLocaleDateString("en-GH",
{weekday:"short"})
),

datasets:[

{
label:label,
data:data.daily[varName].slice(0,5),
borderWidth:2,
tension:.4,
pointRadius:4
},

{
label:"Baseline",
data:[baseline,baseline,baseline,baseline,baseline],
borderDash:[6,6],
pointRadius:0,
borderWidth:2
}

]
},

options:{
responsive:true,
maintainAspectRatio:false,
plugins:{
legend:{
labels:{color:"#eee"}
}
},
scales:{
x:{ticks:{color:"#aaa"}},
y:{ticks:{color:"#aaa"}}
}
}

});

}

/* =========================
   HOURLY CHART
========================= */
function drawHourly(data,baseline){

if(hourlyChart) hourlyChart.destroy();

hourlyChart = new Chart(
document.getElementById("hourlyChart"),
{
type:"line",

data:{
labels:data.hourly.time.slice(0,24)
.map(v=>v.split("T")[1].slice(0,5)),

datasets:[

{
label:"Hourly Mean °C",
data:data.hourly.temperature_2m.slice(0,24),
borderWidth:2,
tension:.35,
pointRadius:2
},

{
label:"Baseline",
data:new Array(24).fill(baseline),
borderDash:[6,6],
pointRadius:0,
borderWidth:2
}

]
},

options:{
responsive:true,
maintainAspectRatio:false,
plugins:{
legend:{
labels:{color:"#eee"}
}
},
scales:{
x:{ticks:{color:"#aaa"}},
y:{ticks:{color:"#aaa"}}
}
}

});

}
