let currentMode="mean";
let activeLayer=null;
let dailyChart=null;
let hourlyChart=null;

const regionData={
"Ashanti Region":[6.69,-1.62],
"Greater Accra Region":[5.56,-0.20],
"Northern Region":[9.40,-0.84],
"Western Region":[4.93,-1.75],
"Eastern Region":[6.09,-0.26],
"Bono Region":[7.33,-2.33],
"Central Region":[5.11,-1.25],
"Volta Region":[6.60,0.47],
"Upper East Region":[10.79,-0.85],
"Upper West Region":[10.06,-2.51],
"Oti Region":[8.07,0.17],
"Bono East Region":[7.59,-1.94],
"Ahafo Region":[6.80,-2.52],
"North East Region":[10.53,-0.37],
"Savannah Region":[9.08,-1.82],
"Western North Region":[6.20,-2.48]
};

const baselines={
mean:29,
max:35,
min:24
};

function clock(){
document.getElementById("datetime").innerHTML=new Date().toLocaleString();
}
clock();
setInterval(clock,30000);

function setMode(mode,el){
currentMode=mode;
document.querySelectorAll(".tab").forEach(t=>t.classList.remove("active"));
el.classList.add("active");
if(window.currentRegion) loadRegion(window.currentRegion);
}

const map=L.map("map",{zoomControl:false});
L.control.zoom({position:"bottomright"}).addTo(map);

fetch("data/geoBoundaries-GHA-ADM1_simplified.geojson")
.then(r=>r.json())
.then(data=>{

const geo=L.geoJSON(data,{
style:{
color:"#fff",
weight:1,
fillColor:"#1f2937",
fillOpacity:.45
},

onEachFeature:(f,l)=>{

let region=f.properties.shapeName;

l.bindTooltip(region);

l.on("click",()=>{
window.currentRegion=region;
loadRegion(region);
});

}
}).addTo(map);

map.fitBounds(geo.getBounds());

});

async function loadRegion(region){

document.getElementById("panelDefault").classList.add("hidden");
document.getElementById("contentPanel").classList.remove("hidden");

document.getElementById("regionName").innerHTML=region;

let [lat,lon]=regionData[region];

let dailyVar={
mean:"temperature_2m_mean",
max:"temperature_2m_max",
min:"temperature_2m_min"
}[currentMode];

let baseline=baselines[currentMode];

let url=`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=${dailyVar}&hourly=temperature_2m&timezone=auto`;

let res=await fetch(url);
let data=await res.json();

let forecast=data.daily[dailyVar][0];
let delta=(forecast-baseline).toFixed(2);

let risk="Safe";
if(delta>1) risk="Caution";
if(delta>2) risk="Extreme Caution";
if(delta>3) risk="Danger";
if(delta>4) risk="Extreme Danger";

document.getElementById("riskBadge").innerHTML=risk;
document.getElementById("baseline").innerHTML=baseline;
document.getElementById("forecast").innerHTML=forecast;
document.getElementById("deltaText").innerHTML="Excess Heat: "+delta+" °C";

document.getElementById("health").innerHTML=risk;
document.getElementById("advice").innerHTML="Stay hydrated and reduce midday exposure.";

document.getElementById("fillBar").style.width=Math.min(delta*20,100)+"%";

drawDaily(data,dailyVar,baseline);
drawHourly(data,baseline);

}

function drawDaily(data,varName,baseline){

if(dailyChart) dailyChart.destroy();

dailyChart=new Chart(document.getElementById("dailyChart"),{
type:"line",
data:{
labels:data.daily.time.slice(0,5),
datasets:[
{
label:"Forecast",
data:data.daily[varName].slice(0,5),
borderWidth:2,
tension:.4
},
{
label:"Baseline",
data:[baseline,baseline,baseline,baseline,baseline],
borderDash:[5,5],
borderWidth:2
}
]
}
});
}

function drawHourly(data,baseline){

if(hourlyChart) hourlyChart.destroy();

hourlyChart=new Chart(document.getElementById("hourlyChart"),{
type:"line",
data:{
labels:data.hourly.time.slice(0,24).map(v=>v.split("T")[1]),
datasets:[
{
label:"Hourly Mean",
data:data.hourly.temperature_2m.slice(0,24),
borderWidth:2,
tension:.4
},
{
label:"Baseline",
data:new Array(24).fill(baseline),
borderDash:[5,5],
borderWidth:2
}
]
}
});
}
