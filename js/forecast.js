let currentMode = "mean";
let activeLayer = null;
let dailyChart = null;
let hourlyChart = null;

// ================= TIME =================
function clock(){
document.getElementById("datetime").innerHTML =
new Date().toLocaleString();
}
clock();
setInterval(clock,30000);

// ================= MODE =================
function setMode(mode,el){
currentMode = mode;

document.querySelectorAll(".tab")
.forEach(t=>t.classList.remove("active"));

el.classList.add("active");

if(window.currentRegion){
loadRegion(window.currentRegion);
}
}

// ================= MAP =================
const map = L.map("map",{zoomControl:false});
L.control.zoom({position:"bottomright"}).addTo(map);

fetch("data/geoBoundaries-GHA-ADM1_simplified.geojson")
.then(r=>r.json())
.then(data=>{

const geo = L.geoJSON(data,{
style:{
color:"#fff",
weight:1.2,
fillColor:"#1f2937",
fillOpacity:.45
},

onEachFeature:(f,l)=>{

let region = f.properties.shapeName;

l.bindTooltip(region);

l.on("click",()=>{

window.currentRegion = region;

if(activeLayer){
geo.resetStyle(activeLayer);
}

activeLayer = l;

l.setStyle({
weight:2.5,
fillOpacity:0.8
});

loadRegion(region);

});

}
}).addTo(map);

map.fitBounds(geo.getBounds());

});

// ================= LOAD REGION =================
async function loadRegion(region){

// hide default / show panels
document.getElementById("panelDefault").classList.add("hidden");
document.getElementById("forecastCard").classList.remove("hidden");
document.getElementById("trendSection").classList.remove("hidden");

// 🔥 CALL FLASK API (IMPORTANT FIX)
let res = await fetch(`/api/forecast?city=${region}&mode=${currentMode}`);
let d = await res.json();

// ================= CARD =================
document.getElementById("cardRegion").innerHTML = d.city;
document.getElementById("riskBadge").innerHTML = d.risk;

document.getElementById("tempBaseline").innerHTML = d.baseline;
document.getElementById("tempForecast").innerHTML = d.forecast;

document.getElementById("heatLabel").innerHTML =
"Excess Heat: " + d.delta + "°C";

document.getElementById("effectText").innerHTML = d.health;
document.getElementById("adviceText").innerHTML = d.advice;

// heat bar
let pct = Math.min((Math.max(d.delta,0)/5)*100,100);
document.getElementById("heatFill").style.width = pct + "%";

// ================= CHARTS =================
drawDailyChart(region, d.baseline);
drawHourlyChart(region, d.baseline);

}

// ================= REGION COORDS =================
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

// ================= DAILY CHART =================
async function drawDailyChart(region, baseline){

let [lat,lon] = regionData[region];

let variable={
mean:"temperature_2m_mean",
max:"temperature_2m_max",
min:"temperature_2m_min"
}[currentMode];

let res = await fetch(
`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=${variable}&timezone=auto`
);

let data = await res.json();

if(dailyChart) dailyChart.destroy();

dailyChart = new Chart(document.getElementById("trendChart"),{
type:"line",
data:{
labels:data.daily.time.slice(0,5).map(d=>
new Date(d).toLocaleDateString("en-GH",{weekday:"short"})
),
datasets:[
{
label:"Forecast",
data:data.daily[variable].slice(0,5),
tension:.4,
borderWidth:2
},
{
label:"Baseline",
data:new Array(5).fill(baseline),
borderDash:[6,6],
borderWidth:2
}
]
},
options:{responsive:true,maintainAspectRatio:false}
});
}

// ================= HOURLY CHART =================
async function drawHourlyChart(region, baseline){

let [lat,lon] = regionData[region];

let res = await fetch(
`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m&timezone=auto`
);

let data = await res.json();

if(hourlyChart) hourlyChart.destroy();

hourlyChart = new Chart(document.getElementById("hourlyChart"),{
type:"line",
data:{
labels:data.hourly.time.slice(0,24).map(t=>t.split("T")[1].slice(0,5)),
datasets:[
{
label:"Hourly Mean °C",
data:data.hourly.temperature_2m.slice(0,24),
tension:.35,
borderWidth:2
},
{
label:"Baseline",
data:new Array(24).fill(baseline),
borderDash:[6,6],
borderWidth:2
}
]
},
options:{responsive:true,maintainAspectRatio:false}
});
}
