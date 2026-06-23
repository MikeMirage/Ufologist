#!/usr/bin/env node
// Exporta candidatos oficiales normalizados a un JSON compacto para frontend.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const IN_FILE = path.join(ROOT, 'data', 'sources', 'normalized', 'acquired_cases.jsonl');
const OUT_FILE = path.join(ROOT, 'data', 'official-cases.json');
const OUT_JS_FILE = path.join(ROOT, 'data', 'official-cases.js');

const SOURCE_LABELS = {
  chile_sefaa: 'Chile SEFAA',
  uk_mod: 'UK MoD',
  argentina_ciae: 'Argentina CIAE',
  nara_uap: 'NARA / FAA SkyWatch',
  spain_defensa: 'España Defensa',
};

const SOURCE_COUNTRIES = {
  chile_sefaa: 'Chile',
  uk_mod: 'United Kingdom',
  argentina_ciae: 'Argentina',
  nara_uap: 'United States',
  spain_defensa: 'Spain',
};

function norm(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’']/g, '')
    .toLowerCase();
}

const COUNTRY_GEO = {
  chile: [-35.6751, -71.5430, 'country', 'Chile'],
  'united kingdom': [54.8, -2.5, 'country', 'United Kingdom'],
  argentina: [-38.4161, -63.6167, 'country', 'Argentina'],
  'united states': [39.5, -98.35, 'country', 'United States'],
  spain: [40.4168, -3.7038, 'country', 'Spain'],
};

const CHILE_GEO = {
  'lo barnechea': [-33.35, -70.52, 'locality'],
  'puerto montt': [-41.47, -72.94, 'locality'],
  osorno: [-40.57, -73.14, 'locality'],
  pichicuy: [-32.35, -71.45, 'locality'],
  'punta arenas': [-53.16, -70.91, 'locality'],
  independencia: [-33.41, -70.66, 'locality'],
  ticnama: [-18.58, -69.72, 'locality'],
  'san javier de loncomilla': [-35.60, -71.73, 'locality'],
  frutillar: [-41.13, -73.04, 'locality'],
  santiago: [-33.45, -70.66, 'locality'],
  renca: [-33.40, -70.73, 'locality'],
  'san pedro de atacama': [-22.91, -68.20, 'locality'],
  'faro carranza': [-35.59, -72.62, 'locality'],
  'san bernardo': [-33.59, -70.70, 'locality'],
  'puerto saavedra': [-38.78, -73.39, 'locality'],
  antofagasta: [-23.65, -70.40, 'locality'],
  'pedro aguirre cerda': [-33.49, -70.67, 'locality'],
  puchuncavi: [-32.73, -71.41, 'locality'],
  cerrillos: [-33.50, -70.72, 'locality'],
  lanalhue: [-37.91, -73.34, 'area'],
  temuco: [-38.74, -72.59, 'locality'],
  'vina del mar': [-33.02, -71.55, 'locality'],
  melipilla: [-33.69, -71.22, 'locality'],
  'san carlos': [-36.42, -71.96, 'locality'],
  parral: [-36.14, -71.83, 'locality'],
  'san nicolas': [-36.50, -72.22, 'locality'],
  talcahuano: [-36.72, -73.12, 'locality'],
  fresia: [-41.15, -73.42, 'locality'],
  penaflor: [-33.61, -70.88, 'locality'],
  coinco: [-34.27, -70.96, 'locality'],
  pirque: [-33.64, -70.57, 'locality'],
  rancagua: [-34.17, -70.74, 'locality'],
  maipu: [-33.51, -70.76, 'locality'],
  pemuco: [-36.98, -72.10, 'locality'],
  colbun: [-35.70, -71.41, 'locality'],
  donihue: [-34.23, -70.96, 'locality'],
  'puerto varas': [-41.32, -72.98, 'locality'],
  'los libertadores': [-32.83, -70.07, 'area'],
  copiapo: [-27.37, -70.33, 'locality'],
  providencia: [-33.43, -70.62, 'locality'],
  villarrica: [-39.28, -72.23, 'locality'],
  pudahuel: [-33.44, -70.76, 'locality'],
  peralillo: [-34.48, -71.48, 'locality'],
  panguipulli: [-39.64, -72.33, 'locality'],
  'puente alto': [-33.62, -70.59, 'locality'],
  iquique: [-20.21, -70.15, 'locality'],
};

const CHILE_REGION_GEO = {
  metropolitana: [-33.45, -70.66, 'region', 'Metropolitana'],
  'los lagos': [-41.47, -72.94, 'region', 'Los Lagos'],
  valparaiso: [-33.05, -71.62, 'region', 'Valparaíso'],
  magallanes: [-53.16, -70.91, 'region', 'Magallanes'],
  'arica y parinacota': [-18.48, -70.31, 'region', 'Arica y Parinacota'],
  maule: [-35.43, -71.66, 'region', 'Maule'],
  antofagasta: [-23.65, -70.40, 'region', 'Antofagasta'],
  araucania: [-38.74, -72.59, 'region', 'Araucanía'],
  biobio: [-36.82, -73.05, 'region', 'Biobío'],
  nuble: [-36.61, -72.10, 'region', 'Ñuble'],
  ohiggins: [-34.17, -70.74, 'region', "O'Higgins"],
};

const ARG_PROVINCE_GEO = {
  'buenos aires': [-36.68, -60.56, 'province', 'Buenos Aires'],
  'bs aires': [-36.68, -60.56, 'province', 'Buenos Aires'],
  'bs. aires': [-36.68, -60.56, 'province', 'Buenos Aires'],
  'b. a.': [-36.68, -60.56, 'province', 'Buenos Aires'],
  'pcia. de bs. aires': [-36.68, -60.56, 'province', 'Buenos Aires'],
  'prov. de bs. aires': [-36.68, -60.56, 'province', 'Buenos Aires'],
  'pcia. de b. a.': [-36.68, -60.56, 'province', 'Buenos Aires'],
  'bs as': [-36.68, -60.56, 'province', 'Buenos Aires'],
  'bs. as': [-36.68, -60.56, 'province', 'Buenos Aires'],
  caba: [-34.60, -58.38, 'locality', 'CABA'],
  'c.a.b.a.': [-34.60, -58.38, 'locality', 'CABA'],
  'ciudad autonoma de bs. aires': [-34.60, -58.38, 'locality', 'CABA'],
  'ciudad de bs. aires': [-34.60, -58.38, 'locality', 'CABA'],
  'capital federal': [-34.60, -58.38, 'locality', 'CABA'],
  'ciudad de buenos aires': [-34.60, -58.38, 'locality', 'CABA'],
  cordoba: [-31.42, -64.18, 'province', 'Córdoba'],
  cba: [-31.42, -64.18, 'province', 'Córdoba'],
  'cba.': [-31.42, -64.18, 'province', 'Córdoba'],
  santa_fe: [-31.63, -60.70, 'province', 'Santa Fe'],
  'santa fe': [-31.63, -60.70, 'province', 'Santa Fe'],
  'entre rios': [-31.74, -60.52, 'province', 'Entre Ríos'],
  'e rios': [-31.74, -60.52, 'province', 'Entre Ríos'],
  'e. rios': [-31.74, -60.52, 'province', 'Entre Ríos'],
  tucuman: [-26.82, -65.22, 'province', 'Tucumán'],
  'la rioja': [-29.41, -66.86, 'province', 'La Rioja'],
  neuquen: [-38.95, -68.06, 'province', 'Neuquén'],
  'rio negro': [-40.81, -63.00, 'province', 'Río Negro'],
  mendoza: [-32.89, -68.84, 'province', 'Mendoza'],
  'san juan': [-31.54, -68.54, 'province', 'San Juan'],
  'san luis': [-33.30, -66.34, 'province', 'San Luis'],
  chaco: [-27.45, -58.99, 'province', 'Chaco'],
  corrientes: [-27.47, -58.83, 'province', 'Corrientes'],
  jujuy: [-24.19, -65.30, 'province', 'Jujuy'],
  'santa cruz': [-51.62, -69.22, 'province', 'Santa Cruz'],
  salta: [-24.79, -65.41, 'province', 'Salta'],
  misiones: [-27.36, -55.90, 'province', 'Misiones'],
  chubut: [-43.30, -65.10, 'province', 'Chubut'],
  'tierra del fuego': [-53.79, -67.70, 'province', 'Tierra del Fuego'],
  'la pampa': [-36.62, -64.29, 'province', 'La Pampa'],
  'santiago del estero': [-27.78, -64.26, 'province', 'Santiago del Estero'],
  'sgo. del estero': [-27.78, -64.26, 'province', 'Santiago del Estero'],
  'sgo del estero': [-27.78, -64.26, 'province', 'Santiago del Estero'],
  catamarca: [-28.47, -65.78, 'province', 'Catamarca'],
  formosa: [-26.18, -58.18, 'province', 'Formosa'],
};

const ARG_CITY_GEO = {
  tandil: [-37.32, -59.13, 'locality'],
  ensenada: [-34.86, -57.91, 'locality'],
  'trenque lauquen': [-35.97, -62.73, 'locality'],
  'pablo nogues': [-34.48, -58.70, 'locality'],
  'p. nogues': [-34.48, -58.70, 'locality'],
  ranchos: [-35.52, -58.32, 'locality'],
  'san bernardo': [-36.69, -56.68, 'locality'],
  'mar argentino': [-42.0, -59.0, 'area'],
  chanar: [-30.74, -59.32, 'locality'],
  'va. gral. belgrano': [-31.98, -64.56, 'locality', 'Villa General Belgrano'],
  'villa general belgrano': [-31.98, -64.56, 'locality'],
  'san miguel': [-34.54, -58.71, 'locality'],
  'san marcos sierras': [-30.78, -64.64, 'locality'],
  'sol de julio': [-29.55, -63.45, 'locality'],
  'cap. del monte': [-30.86, -64.52, 'locality', 'Capilla del Monte'],
  'c. del monte': [-30.86, -64.52, 'locality', 'Capilla del Monte'],
  'capilla del monte': [-30.86, -64.52, 'locality'],
  'san nicolas': [-33.33, -60.22, 'locality', 'San Nicolás'],
  'monte grande': [-34.82, -58.47, 'locality'],
  'martin coronado': [-34.59, -58.60, 'locality'],
  'cerro champaqui': [-32.01, -64.94, 'area'],
  'puerto de la ciudad de bs. aires': [-34.58, -58.37, 'locality', 'Puerto de Buenos Aires'],
  moron: [-34.65, -58.62, 'locality'],
  'san martin': [-34.58, -58.54, 'locality'],
  'villa carlos paz': [-31.42, -64.50, 'locality'],
  'va. carlos paz': [-31.42, -64.50, 'locality', 'Villa Carlos Paz'],
  'mina clavero': [-31.72, -65.00, 'locality'],
  chivilcoy: [-34.90, -60.02, 'locality'],
  'pto. iguazu': [-25.60, -54.57, 'locality', 'Puerto Iguazú'],
  'puerto iguazu': [-25.60, -54.57, 'locality'],
  'san gustavo': [-30.69, -59.40, 'locality'],
  'bartolome bavio': [-35.15, -57.78, 'locality'],
  'rafael castillo': [-34.72, -58.63, 'locality'],
  'san fernando': [-34.44, -58.56, 'locality'],
  chascomus: [-35.57, -58.01, 'locality'],
  caseros: [-34.61, -58.56, 'locality'],
  gualeguay: [-33.15, -59.31, 'locality'],
  siquiman: [-31.34, -64.48, 'locality'],
  hasenkamp: [-31.51, -59.84, 'locality'],
  rauch: [-36.78, -59.09, 'locality'],
  moreno: [-34.65, -58.79, 'locality'],
  berisso: [-34.87, -57.89, 'locality'],
  'agustin ferrari': [-34.90, -58.66, 'locality'],
  'santo tome': [-31.66, -60.77, 'locality'],
  saladillo: [-35.64, -59.78, 'locality'],
  'la falda': [-31.09, -64.49, 'locality'],
  temperley: [-34.77, -58.38, 'locality'],
  ezeiza: [-34.82, -58.54, 'locality'],
  colon: [-32.22, -58.14, 'locality'],
  'venado tuerto': [-33.75, -61.97, 'locality'],
  'costa entrerriana': [-31.74, -58.70, 'area'],
  'campo de mayo': [-34.53, -58.67, 'area'],
  aep: [-34.56, -58.42, 'airport', 'Aeroparque Jorge Newbery'],
  'punta alta': [-38.88, -62.07, 'locality'],
  hurlingham: [-34.59, -58.64, 'locality'],
  concordia: [-31.39, -58.02, 'locality'],
  mendiolaza: [-31.27, -64.30, 'locality'],
  'villa allende': [-31.30, -64.30, 'locality'],
  famatina: [-28.92, -67.52, 'locality'],
  'villa traful': [-40.66, -71.40, 'locality'],
  'villa giardino': [-31.05, -64.49, 'locality'],
  'general roca': [-39.03, -67.58, 'locality'],
  'gral roca': [-39.03, -67.58, 'locality'],
  adrogue: [-34.80, -58.39, 'locality'],
  'bahia blanca': [-38.72, -62.27, 'locality'],
  'tres arroyos': [-38.37, -60.28, 'locality'],
  funes: [-32.92, -60.81, 'locality'],
  berazategui: [-34.76, -58.21, 'locality'],
  vera: [-29.46, -60.21, 'locality'],
  'la plata': [-34.92, -57.95, 'locality'],
  rosario: [-32.95, -60.64, 'locality'],
  miramar: [-38.27, -57.84, 'locality'],
  pilar: [-34.46, -58.91, 'locality'],
  maipu: [-36.86, -57.88, 'locality'],
  barreal: [-31.65, -69.47, 'locality'],
  banfield: [-34.75, -58.40, 'locality'],
  merlo: [-34.67, -58.73, 'locality'],
  armstrong: [-32.78, -61.60, 'locality'],
  'mar del plata': [-38.00, -57.55, 'locality'],
  barranqueras: [-27.48, -58.93, 'locality'],
  'san miguel de tucuman': [-26.82, -65.22, 'locality'],
  'rio cuarto': [-33.12, -64.35, 'locality'],
  'curuzu cuatia': [-29.79, -58.05, 'locality'],
  'el palomar': [-34.61, -58.61, 'locality'],
  avellaneda: [-34.66, -58.36, 'locality'],
  zapala: [-38.90, -70.07, 'locality'],
  purmamarca: [-23.74, -65.50, 'locality'],
  'sierra colorada': [-40.59, -67.80, 'locality'],
  catriel: [-37.88, -67.80, 'locality'],
  parana: [-31.73, -60.53, 'locality'],
  posadas: [-27.37, -55.90, 'locality'],
  cacheuta: [-33.03, -69.12, 'locality'],
  mendoza: [-32.89, -68.84, 'locality'],
  'puerto piramides': [-42.57, -64.28, 'locality'],
  'rio grande': [-53.79, -67.70, 'locality'],
  cachi: [-25.12, -66.16, 'locality'],
  necochea: [-38.55, -58.74, 'locality'],
  'santa rosa': [-36.62, -64.29, 'locality'],
  'villa gesell': [-37.26, -56.97, 'locality'],
};

const UK_REGION_GEO = {
  'east sussex': [50.91, 0.49, 'county', 'East Sussex'],
  sussex: [50.94, -0.12, 'county', 'Sussex'],
  'west lothian': [55.90, -3.55, 'county', 'West Lothian'],
  lothian: [55.95, -3.19, 'county', 'Lothian'],
  humberside: [53.74, -0.34, 'county', 'Humberside'],
  cleveland: [54.57, -1.23, 'county', 'Cleveland'],
  midlothian: [55.82, -3.09, 'county', 'Midlothian'],
  gwynedd: [52.90, -4.10, 'county', 'Gwynedd'],
  'isle of anglesey': [53.28, -4.31, 'county', 'Isle of Anglesey'],
  anglesey: [53.28, -4.31, 'county', 'Anglesey'],
  dyfed: [52.02, -4.54, 'county', 'Dyfed'],
  hants: [51.06, -1.31, 'county', 'Hampshire'],
  somerset: [51.11, -2.93, 'county', 'Somerset'],
  ayrshire: [55.45, -4.63, 'county', 'Ayrshire'],
  morayshire: [57.65, -3.30, 'county', 'Moray'],
  shropshire: [52.71, -2.75, 'county', 'Shropshire'],
  gloucestershire: [51.86, -2.24, 'county', 'Gloucestershire'],
  'forest of dean': [51.80, -2.55, 'area', 'Forest of Dean'],
  'north argyll': [56.55, -5.30, 'county', 'North Argyll'],
  argyll: [56.25, -5.25, 'county', 'Argyll'],
  grampian: [57.30, -2.70, 'county', 'Grampian'],
  highlands: [57.47, -4.23, 'country-region', 'Scottish Highlands'],
  highland: [57.47, -4.23, 'country-region', 'Scottish Highlands'],
  strathclyde: [55.86, -4.25, 'county', 'Strathclyde'],
  sclyde: [55.86, -4.25, 'county', 'Strathclyde'],
  's clyde': [55.86, -4.25, 'county', 'Strathclyde'],
  'mid glamorgan': [51.60, -3.35, 'county', 'Mid Glamorgan'],
  'hereford & worcester': [52.19, -2.22, 'county', 'Hereford and Worcester'],
  'hereford and worcester': [52.19, -2.22, 'county', 'Hereford and Worcester'],
  bristol: [51.45, -2.59, 'city', 'Bristol'],
  brighton: [50.82, -0.14, 'city', 'Brighton'],
  hove: [50.83, -0.17, 'city', 'Hove'],
  eastbourne: [50.77, 0.29, 'city', 'Eastbourne'],
  hull: [53.75, -0.34, 'city', 'Hull'],
  falkirk: [56.00, -3.78, 'city', 'Falkirk'],
  stirling: [56.12, -3.94, 'city', 'Stirling'],
  airdrie: [55.87, -3.98, 'city', 'Airdrie'],
  stockton: [54.57, -1.31, 'city', 'Stockton-on-Tees'],
  musselburgh: [55.94, -3.05, 'city', 'Musselburgh'],
  bangor: [53.23, -4.13, 'city', 'Bangor'],
  benllech: [53.32, -4.23, 'city', 'Benllech'],
  aldershot: [51.25, -0.76, 'city', 'Aldershot'],
  ludgershall: [51.25, -1.62, 'city', 'Ludgershall'],
  frome: [51.23, -2.32, 'city', 'Frome'],
  hensbridge: [51.02, -2.55, 'locality', 'Henstridge'],
  cumnock: [55.45, -4.27, 'city', 'Cumnock'],
  shrewsbury: [52.71, -2.75, 'city', 'Shrewsbury'],
  livingston: [55.88, -3.52, 'city', 'Livingston'],
  elgin: [57.65, -3.32, 'city', 'Elgin'],
  glasgow: [55.86, -4.25, 'city', 'Glasgow'],
  belfast: [54.60, -5.93, 'city', 'Belfast'],
  lewes: [50.87, 0.01, 'city', 'Lewes'],
  hastings: [50.86, 0.57, 'city', 'Hastings'],
  prestwick: [55.50, -4.61, 'city', 'Prestwick'],
  dundee: [56.46, -2.97, 'city', 'Dundee'],
  aberdeen: [57.15, -2.09, 'city', 'Aberdeen'],
  nottingham: [52.95, -1.15, 'city', 'Nottingham'],
  derby: [52.92, -1.48, 'city', 'Derby'],
  stoke: [53.00, -2.18, 'city', 'Stoke-on-Trent'],
  wigtonshire: [54.90, -4.45, 'county', 'Wigtownshire'],
  wigtownshire: [54.90, -4.45, 'county', 'Wigtownshire'],
  perthshire: [56.40, -3.43, 'county', 'Perthshire'],
  lancashire: [53.76, -2.70, 'county', 'Lancashire'],
  denbighshire: [53.09, -3.36, 'county', 'Denbighshire'],
  warwickshire: [52.28, -1.58, 'county', 'Warwickshire'],
  staffordshire: [52.81, -2.12, 'county', 'Staffordshire'],
  staffs: [52.81, -2.12, 'county', 'Staffordshire'],
  'county down': [54.35, -5.75, 'county', 'County Down'],
  carmarthenshire: [51.86, -4.31, 'county', 'Carmarthenshire'],
  'ross shire': [57.60, -4.60, 'county', 'Ross-shire'],
  rossshire: [57.60, -4.60, 'county', 'Ross-shire'],
  renfrewshire: [55.84, -4.52, 'county', 'Renfrewshire'],
  flintshire: [53.17, -3.14, 'county', 'Flintshire'],
  durham: [54.78, -1.57, 'county', 'County Durham'],
  tayside: [56.46, -3.00, 'county', 'Tayside'],
  'northern ireland': [54.60, -5.93, 'country-region', 'Northern Ireland'],
  guernsey: [49.45, -2.59, 'country-region', 'Guernsey'],
  'st peter port': [49.46, -2.54, 'city', 'St Peter Port'],
  antrim: [54.72, -6.20, 'county', 'County Antrim'],
  'co. antrim': [54.72, -6.20, 'county', 'County Antrim'],
  angus: [56.67, -2.92, 'county', 'Angus'],
  'dumfries & galloway': [55.07, -3.60, 'county', 'Dumfries and Galloway'],
  'dumfries and galloway': [55.07, -3.60, 'county', 'Dumfries and Galloway'],
  banffshire: [57.66, -2.52, 'county', 'Banffshire'],
  caithness: [58.45, -3.35, 'county', 'Caithness'],
  'east midlands': [52.80, -1.30, 'country-region', 'East Midlands'],
  'isle of man': [54.23, -4.55, 'country-region', 'Isle of Man'],
  northumbria: [55.10, -1.90, 'county', 'Northumbria'],
  wirral: [53.37, -3.07, 'area', 'Wirral'],
  'high lands': [57.47, -4.23, 'country-region', 'Scottish Highlands'],
  carlisle: [54.89, -2.94, 'city', 'Carlisle'],
  glengormley: [54.68, -5.96, 'city', 'Glengormley'],
  lisburn: [54.51, -6.04, 'city', 'Lisburn'],
  arbroath: [56.56, -2.59, 'city', 'Arbroath'],
  evanton: [57.66, -4.34, 'locality', 'Evanton'],
  newbridge: [55.12, -3.72, 'locality', 'Newbridge'],
  invergowrie: [56.46, -3.06, 'locality', 'Invergowrie'],
  wick: [58.44, -3.09, 'city', 'Wick'],
  swinton: [53.51, -2.34, 'city', 'Swinton'],
  'newcastle-upon-tyne': [54.98, -1.61, 'city', 'Newcastle upon Tyne'],
  berwick: [55.77, -2.01, 'city', 'Berwick-upon-Tweed'],
  inverness: [57.48, -4.22, 'city', 'Inverness'],
  nairnside: [57.50, -4.08, 'locality', 'Nairnside'],
  notts: [52.95, -1.15, 'county', 'Nottinghamshire'],
  nottinghamshire: [52.95, -1.15, 'county', 'Nottinghamshire'],
  cromer: [52.93, 1.30, 'city', 'Cromer'],
  dumfries: [55.07, -3.61, 'city', 'Dumfries'],
  'gtr manchester': [53.48, -2.24, 'county', 'Greater Manchester'],
  coningsby: [53.09, -0.18, 'locality', 'Coningsby'],
  benbecula: [57.47, -7.36, 'island', 'Benbecula'],
  salop: [52.71, -2.75, 'county', 'Shropshire'],
  'east kilbride': [55.76, -4.18, 'city', 'East Kilbride'],
  'tyne and wear': [54.98, -1.61, 'county', 'Tyne and Wear'],
  worcester: [52.19, -2.22, 'city', 'Worcester'],
  bonnybridge: [56.00, -3.89, 'city', 'Bonnybridge'],
  bridgend: [51.51, -3.58, 'city', 'Bridgend'],
  crosby: [53.48, -3.03, 'city', 'Crosby'],
  pembrokeshire: [51.83, -4.90, 'county', 'Pembrokeshire'],
  'newcastle upon tyne': [54.98, -1.61, 'city', 'Newcastle upon Tyne'],
  blairgowrie: [56.59, -3.34, 'city', 'Blairgowrie'],
  bolton: [53.58, -2.43, 'city', 'Bolton'],
  corwen: [52.98, -3.38, 'city', 'Corwen'],
  lichfield: [52.68, -1.83, 'city', 'Lichfield'],
  ballykinler: [54.25, -5.83, 'locality', 'Ballykinler'],
  seaforde: [54.33, -5.83, 'locality', 'Seaforde'],
  'newcastle emlyn': [52.04, -4.47, 'city', 'Newcastle Emlyn'],
  ardross: [57.73, -4.35, 'locality', 'Ardross'],
  greenock: [55.95, -4.76, 'city', 'Greenock'],
  admaston: [52.72, -2.53, 'locality', 'Admaston'],
  flint: [53.25, -3.13, 'city', 'Flint'],
  peterlee: [54.76, -1.34, 'city', 'Peterlee'],
  murthly: [56.53, -3.48, 'locality', 'Murthly'],
  cheshire: [53.23, -2.61, 'county', 'Cheshire'],
  wiltshire: [51.35, -1.99, 'county', 'Wiltshire'],
  lanarkshire: [55.68, -3.78, 'county', 'Lanarkshire'],
  'greater manchester': [53.48, -2.24, 'county', 'Greater Manchester'],
  glamorgan: [51.50, -3.58, 'county', 'Glamorgan'],
  'west glamorgan': [51.62, -3.95, 'county', 'West Glamorgan'],
  'south glamorgan': [51.47, -3.18, 'county', 'South Glamorgan'],
  northamptonshire: [52.24, -0.90, 'county', 'Northamptonshire'],
  hampshire: [51.06, -1.31, 'county', 'Hampshire'],
  london: [51.51, -0.13, 'city', 'London'],
  surrey: [51.25, -0.40, 'county', 'Surrey'],
  berkshire: [51.45, -1.03, 'county', 'Berkshire'],
  lincolnshire: [53.20, -0.55, 'county', 'Lincolnshire'],
  cambridgeshire: [52.25, 0.12, 'county', 'Cambridgeshire'],
  yorkshire: [53.96, -1.08, 'county', 'Yorkshire'],
  'east yorkshire': [53.84, -0.43, 'county', 'East Yorkshire'],
  'west yorkshire': [53.80, -1.55, 'county', 'West Yorkshire'],
  'north yorkshire': [54.20, -1.30, 'county', 'North Yorkshire'],
  suffolk: [52.19, 0.97, 'county', 'Suffolk'],
  norfolk: [52.63, 1.30, 'county', 'Norfolk'],
  kent: [51.19, 0.73, 'county', 'Kent'],
  fife: [56.20, -3.15, 'county', 'Fife'],
  gwent: [51.75, -2.90, 'county', 'Gwent'],
  clwyd: [53.17, -3.30, 'county', 'Clwyd'],
  powys: [52.35, -3.40, 'county', 'Powys'],
  middlesex: [51.50, -0.40, 'county', 'Middlesex'],
  'west midlands': [52.48, -1.89, 'county', 'West Midlands'],
  dorset: [50.75, -2.33, 'county', 'Dorset'],
  herefordshire: [52.08, -2.75, 'county', 'Herefordshire'],
  stirlingshire: [56.12, -3.94, 'county', 'Stirlingshire'],
  'county durham': [54.78, -1.57, 'county', 'County Durham'],
  buckinghamshire: [51.81, -0.81, 'county', 'Buckinghamshire'],
  'west sussex': [50.93, -0.45, 'county', 'West Sussex'],
  'south yorkshire': [53.48, -1.33, 'county', 'South Yorkshire'],
  'northumberland': [55.25, -2.05, 'county', 'Northumberland'],
  merseyside: [53.41, -2.99, 'county', 'Merseyside'],
  leicestershire: [52.64, -1.13, 'county', 'Leicestershire'],
  cumbria: [54.58, -2.80, 'county', 'Cumbria'],
  devon: [50.72, -3.53, 'county', 'Devon'],
  cornwall: [50.27, -5.05, 'county', 'Cornwall'],
  essex: [51.73, 0.47, 'county', 'Essex'],
  hertfordshire: [51.75, -0.34, 'county', 'Hertfordshire'],
  bedfordshire: [52.14, -0.47, 'county', 'Bedfordshire'],
  oxfordshire: [51.75, -1.26, 'county', 'Oxfordshire'],
  worcestershire: [52.19, -2.22, 'county', 'Worcestershire'],
  aberdeenshire: [57.15, -2.10, 'county', 'Aberdeenshire'],
  'inverness-shire': [57.48, -4.22, 'county', 'Inverness-shire'],
  'isle of wight': [50.69, -1.30, 'county', 'Isle of Wight'],
  scotland: [56.49, -4.20, 'country-region', 'Scotland'],
  wales: [52.13, -3.78, 'country-region', 'Wales'],
  england: [52.36, -1.17, 'country-region', 'England'],
};

const FAA_GEO = {
  NCRCC: [38.90, -77.04, 'facility', 'National Capital Region Coordination Center'],
  PCT: [38.85, -77.04, 'facility', 'Potomac TRACON'],
  I90: [29.98, -95.34, 'facility', 'Houston TRACON'],
  WOC: [38.90, -77.04, 'facility', 'Washington Operations Center'],
  N90: [40.78, -73.10, 'facility', 'New York TRACON'],
  SCT: [33.94, -118.41, 'facility', 'Southern California TRACON'],
  NCT: [37.62, -122.38, 'facility', 'Northern California TRACON'],
  NZY: [32.70, -117.21, 'airport', 'NAS North Island'],
  'JATOC-AWO': [38.90, -77.04, 'facility', 'JATOC / AWO'],
  HQ: [38.90, -77.04, 'facility', 'FAA Headquarters'],
  AWO: [38.90, -77.04, 'facility', 'Airspace Watch Office'],
  P31: [30.47, -87.19, 'facility', 'Pensacola TRACON'],
  NHK: [38.29, -76.41, 'airport', 'NAS Patuxent River'],
  D01: [39.86, -104.67, 'facility', 'Denver TRACON'],
  ZKC: [38.85, -94.74, 'facility', 'Kansas City ARTCC'],
  ZDV: [39.86, -104.67, 'facility', 'Denver ARTCC'],
  ZDC: [39.09, -77.56, 'facility', 'Washington ARTCC'],
  ZME: [35.04, -89.98, 'facility', 'Memphis ARTCC'],
  ZMA: [25.80, -80.29, 'facility', 'Miami ARTCC'],
  ZJX: [30.49, -81.69, 'facility', 'Jacksonville ARTCC'],
  ZLC: [40.79, -111.98, 'facility', 'Salt Lake City ARTCC'],
  ZAB: [35.05, -106.62, 'facility', 'Albuquerque ARTCC'],
  ZNY: [40.79, -73.10, 'facility', 'New York ARTCC'],
  ZLA: [34.20, -118.36, 'facility', 'Los Angeles ARTCC'],
  ZMP: [44.88, -93.22, 'facility', 'Minneapolis ARTCC'],
  ZBW: [42.74, -71.48, 'facility', 'Boston ARTCC'],
  ZHU: [29.65, -95.28, 'facility', 'Houston ARTCC'],
  ZFW: [32.83, -97.06, 'facility', 'Fort Worth ARTCC'],
  ZTL: [33.37, -84.57, 'facility', 'Atlanta ARTCC'],
  ZID: [39.73, -86.28, 'facility', 'Indianapolis ARTCC'],
  ZOB: [41.30, -82.20, 'facility', 'Cleveland ARTCC'],
  ZAU: [41.78, -88.32, 'facility', 'Chicago ARTCC'],
  ZOA: [37.66, -122.12, 'facility', 'Oakland ARTCC'],
  ZAN: [61.17, -150.00, 'facility', 'Anchorage ARTCC'],
  ZSE: [47.45, -122.31, 'facility', 'Seattle ARTCC'],
  CHS: [32.90, -80.04, 'airport', 'Charleston'],
  DCA: [38.85, -77.04, 'airport', 'Washington National'],
  MIA: [25.79, -80.29, 'airport', 'Miami'],
  LAX: [33.94, -118.41, 'airport', 'Los Angeles'],
  DFW: [32.90, -97.04, 'airport', 'Dallas-Fort Worth'],
  COS: [38.81, -104.70, 'airport', 'Colorado Springs'],
  DAB: [29.18, -81.06, 'airport', 'Daytona Beach'],
  BHM: [33.56, -86.75, 'airport', 'Birmingham'],
  ACY: [39.46, -74.58, 'airport', 'Atlantic City'],
  GTF: [47.48, -111.37, 'airport', 'Great Falls'],
  SAT: [29.53, -98.47, 'airport', 'San Antonio'],
  PSP: [33.83, -116.51, 'airport', 'Palm Springs'],
  SWF: [41.50, -74.10, 'airport', 'Newburgh/Stewart'],
  MCI: [39.30, -94.71, 'airport', 'Kansas City'],
  FWA: [40.98, -85.19, 'airport', 'Fort Wayne'],
};

const SPAIN_GEO = {
  barcelona: [41.39, 2.17, 'province'],
  huesca: [42.14, -0.41, 'province'],
  lerida: [41.62, 0.62, 'province'],
  navarra: [42.82, -1.65, 'province'],
  gerona: [41.98, 2.82, 'province'],
  girona: [41.98, 2.82, 'province'],
  burgos: [42.34, -3.70, 'province'],
  canarias: [28.29, -16.63, 'region'],
  tenerife: [28.29, -16.63, 'island'],
  'las palmas': [28.12, -15.43, 'province'],
  logrono: [42.46, -2.45, 'province'],
  sevilla: [37.39, -5.99, 'province'],
  'oceano atlantico': [31.0, -12.0, 'area'],
  madrid: [40.42, -3.70, 'province'],
  baleares: [39.57, 2.65, 'region'],
  mallorca: [39.57, 2.65, 'island'],
  coruna: [43.36, -8.41, 'province'],
  alicante: [38.35, -0.49, 'province'],
  vizcaya: [43.26, -2.93, 'province'],
  gijon: [43.53, -5.66, 'locality'],
  reus: [41.15, 1.11, 'locality'],
  badajoz: [38.88, -6.97, 'province'],
  almeria: [36.84, -2.46, 'province'],
  cantabrico: [43.7, -4.2, 'area'],
};

const SHAPE_TO_INDEX = {
  Light: 0,
  Fireball: 1,
  Sphere: 2,
  Circle: 2,
  Triangle: 3,
  Disk: 4,
  Cigar: 5,
  Cylinder: 5,
  Oval: 6,
  Teardrop: 6,
  Rectangle: 7,
  Diamond: 7,
  Chevron: 7,
  Cone: 7,
  Cross: 7,
  Formation: 8,
  Changing: 9,
  Flash: 9,
  Egg: 9,
  Unknown: 9,
  Other: 9,
};

function lines(file) {
  return fs.readFileSync(file, 'utf8').trim().split('\n').filter(Boolean);
}

function dateInt(iso) {
  if (!iso) return null;
  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? Number(`${m[1]}${m[2]}${m[3]}`) : null;
}

function hourInt(time) {
  const m = String(time || '').match(/^(\d{1,2}):/);
  if (!m) return -1;
  const h = Number(m[1]);
  return h >= 0 && h <= 23 ? h : -1;
}

function firstYear(...values) {
  for (const value of values) {
    const m = String(value || '').match(/\b((?:19|20)\d{2})\b/);
    if (m) return Number(m[1]);
  }
  return null;
}

function sourceLink(row) {
  if (row.source_url) return row.source_url;
  if (row.source_id === 'nara_uap') return 'https://www.archives.gov/research/topics/uaps';
  if (row.source_id === 'spain_defensa') return 'https://bibliotecavirtual.defensa.gob.es/BVMDefensa/exp_ovni/es/consulta/indice_campo.do?campo=idtitulo';
  if (row.source_id === 'uk_mod') return 'https://www.gov.uk/government/publications/ufo-reports-in-the-uk';
  if (row.source_id === 'chile_sefaa') return 'https://sefaa.dgac.gob.cl/';
  if (row.source_id === 'argentina_ciae') return 'https://www.argentina.gob.ar/fuerzaaerea/ciae';
  return '';
}

function findInText(text, dict) {
  const n = norm(text);
  const keys = Object.keys(dict).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    if (n.includes(key)) return dict[key];
  }
  return null;
}

function geoFromTuple(tuple, label) {
  if (!tuple) return null;
  return { lat: tuple[0], lng: tuple[1], precision: tuple[2], label: label || tuple[3] || tuple[2] };
}

function approximateGeocode(row) {
  if (Number.isFinite(row.lat) && Number.isFinite(row.lng)) {
    return { lat: row.lat, lng: row.lng, precision: 'reported', label: 'reported coordinates' };
  }
  const loc = row.location_name || '';
  const region = row.region || '';
  const country = row.country || SOURCE_COUNTRIES[row.source_id] || '';
  const text = [loc, region, country, row.description, row.raw_text].filter(Boolean).join(' ');
  if (/^n\/?a$/i.test(loc.trim())) {
    if (row.source_id === 'chile_sefaa' && norm(text).includes('jorge chavez')) {
      return { lat: -16.0, lng: -75.0, precision: 'area', label: 'Pacific corridor near Jorge Chavez' };
    }
    return null;
  }

  if (row.source_id === 'nara_uap') {
    const code = row.reporting_facility || row.location_name || row.region || '';
    const direct = FAA_GEO[String(code).trim().toUpperCase()];
    if (direct) return geoFromTuple(direct);
    return geoFromTuple(COUNTRY_GEO['united states']);
  }
  if (row.source_id === 'chile_sefaa') {
    return geoFromTuple(findInText(loc, CHILE_GEO) || findInText(region, CHILE_REGION_GEO) || findInText(text, CHILE_REGION_GEO) || COUNTRY_GEO.chile);
  }
  if (row.source_id === 'argentina_ciae') {
    return geoFromTuple(findInText(loc, ARG_CITY_GEO) || findInText(text, ARG_CITY_GEO) || findInText(text, ARG_PROVINCE_GEO) || COUNTRY_GEO.argentina);
  }
  if (row.source_id === 'uk_mod') {
    return geoFromTuple(findInText(region, UK_REGION_GEO) || findInText(loc, UK_REGION_GEO) || findInText(row.description || '', UK_REGION_GEO) || COUNTRY_GEO['united kingdom']);
  }
  if (row.source_id === 'spain_defensa') {
    return geoFromTuple(findInText(loc, SPAIN_GEO) || findInText(text, SPAIN_GEO) || COUNTRY_GEO.spain);
  }
  return geoFromTuple(findInText(country, COUNTRY_GEO));
}

function main() {
  const rows = lines(IN_FILE).map(line => JSON.parse(line));
  const cases = rows.map(row => {
    const d = dateInt(row.event_date);
    const title = row.catalog_title || row.case_title || row.description || row.location_name || row.source_case_id || 'Official UAP record';
    const summary = row.description || row.raw_text || '';
    const sourceId = row.source_id;
    const geo = approximateGeocode(row);
    return {
      id: row.id,
      sid: sourceId,
      source: SOURCE_LABELS[sourceId] || sourceId,
      recordType: row.record_type || 'case_record',
      sourceCaseId: row.source_case_id || '',
      d,
      date: row.event_date || '',
      h: hourInt(row.event_time),
      time: row.event_time || '',
      year: d ? Math.floor(d / 10000) : firstYear(row.report_year, row.publication_year, row.description, row.raw_text),
      lat: geo ? geo.lat : null,
      lng: geo ? geo.lng : null,
      geoPrecision: geo ? geo.precision : 'none',
      geoLabel: geo ? geo.label : '',
      geoApprox: !!geo && geo.precision !== 'reported',
      loc: row.location_name || row.region || '',
      country: row.country || SOURCE_COUNTRIES[sourceId] || '',
      cls: row.classification_value || '',
      system: row.classification_system || '',
      shape: row.shape_reported || '',
      s: Object.prototype.hasOwnProperty.call(SHAPE_TO_INDEX, row.shape_reported) ? SHAPE_TO_INDEX[row.shape_reported] : 9,
      title: String(title).slice(0, 220),
      summary: String(summary).slice(0, 1200),
      sourceFile: row.source_file || '',
      sourceUrl: sourceLink(row),
      needsReview: row.needs_review !== false,
    };
  }).filter(row => row.year && row.year >= 1900 && row.year <= 2035);

  const bySource = {};
  for (const row of cases) {
    const item = bySource[row.sid] || { id: row.sid, label: row.source, total: 0, geolocated: 0 };
    item.total++;
    if (Number.isFinite(row.lat) && Number.isFinite(row.lng)) item.geolocated++;
    bySource[row.sid] = item;
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    schema: 'official-cases.v1',
    total: cases.length,
    geolocated: cases.filter(row => Number.isFinite(row.lat) && Number.isFinite(row.lng)).length,
    sources: Object.values(bySource).sort((a, b) => b.total - a.total),
    rows: cases,
  };
  fs.writeFileSync(OUT_FILE, JSON.stringify(payload));
  fs.writeFileSync(OUT_JS_FILE, `window.OFFICIAL_CASES_DATA=${JSON.stringify(payload)};\n`);
  console.log(`official cases: ${cases.length}`);
  console.log(`geolocated: ${cases.filter(row => Number.isFinite(row.lat) && Number.isFinite(row.lng)).length}`);
  console.log(`out: ${path.relative(ROOT, OUT_FILE)}`);
  console.log(`fallback: ${path.relative(ROOT, OUT_JS_FILE)}`);
}

main();
