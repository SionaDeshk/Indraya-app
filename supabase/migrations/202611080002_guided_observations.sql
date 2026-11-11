-- Canonical IDs are versioned; legacy category/kind fields remain for compatible clients.
create table public.observation_catalog_versions(version integer primary key,fingerprint text not null,created_at timestamptz not null default now());
create table public.observation_catalog_domains(version integer references observation_catalog_versions,id text,definition jsonb not null,primary key(version,id));
create table public.observation_catalog_types(version integer references observation_catalog_versions,id text,definition jsonb not null,primary key(version,id));
create table public.observation_catalog_questions(version integer references observation_catalog_versions,id text,definition jsonb not null,primary key(version,id));
create table public.observation_catalog_topics(version integer,id text,domain_id text,definition jsonb not null,primary key(version,id),unique(version,id,domain_id),foreign key(version,domain_id) references observation_catalog_domains(version,id));
create table public.observation_catalog_routes(version integer,topic_id text,type_id text,primary key(version,topic_id,type_id),foreign key(version,topic_id) references observation_catalog_topics(version,id),foreign key(version,type_id) references observation_catalog_types(version,id));
alter table observation_catalog_versions enable row level security;
alter table observation_catalog_domains enable row level security;
alter table observation_catalog_topics enable row level security;
alter table observation_catalog_types enable row level security;
alter table observation_catalog_questions enable row level security;
alter table observation_catalog_routes enable row level security;
create policy catalog_read on observation_catalog_versions for select using(true);
create policy catalog_read on observation_catalog_domains for select using(true);
create policy catalog_read on observation_catalog_topics for select using(true);
create policy catalog_read on observation_catalog_types for select using(true);
create policy catalog_read on observation_catalog_questions for select using(true);
create policy catalog_read on observation_catalog_routes for select using(true);
insert into observation_catalog_versions(version,fingerprint) values (1,'c85b31e9b0aa771508f7df95def705cb8632c2b5e010997a40e4ebcf75b17362');
insert into observation_catalog_domains(version,id,definition) values (1,'travel','{"id":"travel","label":"Travel & Transportation","description":"Roads, vehicles and access","legacyCategory":"Travel","legacyKind":"road","color":"#7fb0fc"}'::jsonb);
insert into observation_catalog_domains(version,id,definition) values (1,'wildlife','{"id":"wildlife","label":"Wildlife & Animals","description":"Sightings, encounters and welfare","legacyCategory":"Outdoors","legacyKind":"wildlife","color":"#79d5a5"}'::jsonb);
insert into observation_catalog_domains(version,id,definition) values (1,'outdoors','{"id":"outdoors","label":"Trails & Recreation","description":"Trails, parks and public access","legacyCategory":"Outdoors","legacyKind":"trail","color":"#55c9bd"}'::jsonb);
insert into observation_catalog_domains(version,id,definition) values (1,'weather','{"id":"weather","label":"Weather & Natural Conditions","description":"Water, snow, terrain and sky","legacyCategory":"Safety","legacyKind":"hazard","color":"#8ccce8"}'::jsonb);
insert into observation_catalog_domains(version,id,definition) values (1,'environment','{"id":"environment","label":"Fire & Environment","description":"Fire, smoke and environmental observations","legacyCategory":"Safety","legacyKind":"smoke","color":"#e7af79"}'::jsonb);
insert into observation_catalog_domains(version,id,definition) values (1,'community','{"id":"community","label":"Community & Infrastructure","description":"Utilities, public facilities and services","legacyCategory":"Safety","legacyKind":"hazard","color":"#bbc3d1"}'::jsonb);
insert into observation_catalog_domains(version,id,definition) values (1,'safety','{"id":"safety","label":"Safety & Assistance","description":"Public safety and assistance concerns","legacyCategory":"Safety","legacyKind":"hazard","color":"#bda9dc","privacyFloor":"restricted"}'::jsonb);
insert into observation_catalog_domains(version,id,definition) values (1,'discoveries','{"id":"discoveries","label":"Discoveries & Other","description":"Useful local discoveries and other observations","legacyCategory":"Outdoors","legacyKind":"trail","color":"#d5ca8d"}'::jsonb);
insert into observation_catalog_types(version,id,definition) values (1,'road_condition','{"id":"road_condition","label":"Road condition","title":"Road condition observed","family":"travel","color":"#7fb0fc","legacyCategory":"Travel","legacyKind":"road","questions":["surface","visibility","direction","access_impact"],"privacy":"approximate","priority":false,"positive":false,"aliases":[]}'::jsonb);
insert into observation_catalog_types(version,id,definition) values (1,'black_ice','{"id":"black_ice","label":"Black ice","title":"Black ice observed","family":"travel","color":"#7fb0fc","legacyCategory":"Travel","legacyKind":"road","questions":["visibility","direction","access_impact"],"privacy":"approximate","priority":false,"positive":false,"aliases":[]}'::jsonb);
insert into observation_catalog_types(version,id,definition) values (1,'snow_slush','{"id":"snow_slush","label":"Snow or slush","title":"Snow or slush observed","family":"travel","color":"#7fb0fc","legacyCategory":"Travel","legacyKind":"road","questions":["visibility","direction","access_impact"],"privacy":"approximate","priority":false,"positive":false,"aliases":[]}'::jsonb);
insert into observation_catalog_types(version,id,definition) values (1,'pothole','{"id":"pothole","label":"Pothole","title":"Pothole observed","family":"travel","color":"#7fb0fc","legacyCategory":"Travel","legacyKind":"road","questions":["visibility","direction","access_impact"],"privacy":"approximate","priority":false,"positive":false,"aliases":[]}'::jsonb);
insert into observation_catalog_types(version,id,definition) values (1,'washout','{"id":"washout","label":"Road washout","title":"Road washout observed","family":"travel","color":"#7fb0fc","legacyCategory":"Travel","legacyKind":"road","questions":["visibility","direction","access_impact"],"privacy":"approximate","priority":false,"positive":false,"aliases":[]}'::jsonb);
insert into observation_catalog_types(version,id,definition) values (1,'flooding','{"id":"flooding","label":"Flooding","title":"Flooding","family":"weather","color":"#8ccce8","legacyCategory":"Safety","legacyKind":"flooding","questions":["access_impact","location_context","direction"],"privacy":"approximate","priority":false,"positive":false,"aliases":[]}'::jsonb);
insert into observation_catalog_types(version,id,definition) values (1,'debris','{"id":"debris","label":"Debris or obstruction","title":"Debris or obstruction","family":"travel","color":"#7fb0fc","legacyCategory":"Travel","legacyKind":"road","questions":["access_impact","location_context","direction"],"privacy":"approximate","priority":false,"positive":false,"aliases":[]}'::jsonb);
insert into observation_catalog_types(version,id,definition) values (1,'rockfall','{"id":"rockfall","label":"Rockfall","title":"Rockfall","family":"weather","color":"#8ccce8","legacyCategory":"Safety","legacyKind":"hazard","questions":["access_impact","location_context","direction"],"privacy":"approximate","priority":false,"positive":false,"aliases":[]}'::jsonb);
insert into observation_catalog_types(version,id,definition) values (1,'fallen_tree','{"id":"fallen_tree","label":"Fallen tree","title":"Fallen tree","family":"outdoors","color":"#55c9bd","legacyCategory":"Outdoors","legacyKind":"trail","questions":["access_impact","location_context","direction"],"privacy":"approximate","priority":false,"positive":false,"aliases":[]}'::jsonb);
insert into observation_catalog_types(version,id,definition) values (1,'whiteout','{"id":"whiteout","label":"Whiteout","title":"Whiteout","family":"weather","color":"#8ccce8","legacyCategory":"Safety","legacyKind":"hazard","questions":["visibility","access_impact","location_context"],"privacy":"approximate","priority":false,"positive":false,"aliases":["visibility","weather","travel"]}'::jsonb);
insert into observation_catalog_types(version,id,definition) values (1,'fog','{"id":"fog","label":"Fog","title":"Fog","family":"weather","color":"#8ccce8","legacyCategory":"Safety","legacyKind":"hazard","questions":["visibility","access_impact","location_context"],"privacy":"approximate","priority":false,"positive":false,"aliases":["visibility","weather","travel"]}'::jsonb);
insert into observation_catalog_types(version,id,definition) values (1,'blowing_snow','{"id":"blowing_snow","label":"Blowing snow","title":"Blowing snow","family":"weather","color":"#8ccce8","legacyCategory":"Safety","legacyKind":"hazard","questions":["visibility","access_impact","location_context"],"privacy":"approximate","priority":false,"positive":false,"aliases":["visibility","weather","travel"]}'::jsonb);
insert into observation_catalog_types(version,id,definition) values (1,'poor_visibility','{"id":"poor_visibility","label":"Poor visibility","title":"Poor visibility","family":"weather","color":"#8ccce8","legacyCategory":"Safety","legacyKind":"hazard","questions":["visibility","access_impact","location_context"],"privacy":"approximate","priority":false,"positive":false,"aliases":["visibility","weather","travel"]}'::jsonb);
insert into observation_catalog_types(version,id,definition) values (1,'smoke','{"id":"smoke","label":"Smoke observed","title":"Smoke observed","family":"environment","color":"#e7af79","legacyCategory":"Safety","legacyKind":"smoke","questions":["visibility","location_context"],"privacy":"approximate","priority":false,"positive":false,"aliases":["fire","smoke affecting travel"]}'::jsonb);
insert into observation_catalog_types(version,id,definition) values (1,'collision','{"id":"collision","label":"Collision observed","title":"Collision observed","family":"travel","color":"#7fb0fc","legacyCategory":"Travel","legacyKind":"road","questions":["access_impact","direction","injury"],"privacy":"approximate","priority":true,"positive":false,"aliases":["wreck","crash"]}'::jsonb);
insert into observation_catalog_types(version,id,definition) values (1,'vehicle_off_road','{"id":"vehicle_off_road","label":"Vehicle off road","title":"Vehicle off road","family":"travel","color":"#7fb0fc","legacyCategory":"Travel","legacyKind":"road","questions":["access_impact","direction","injury"],"privacy":"approximate","priority":false,"positive":false,"aliases":[]}'::jsonb);
insert into observation_catalog_types(version,id,definition) values (1,'disabled_vehicle','{"id":"disabled_vehicle","label":"Disabled or stuck vehicle","title":"Disabled or stuck vehicle","family":"travel","color":"#7fb0fc","legacyCategory":"Travel","legacyKind":"road","questions":["access_impact","direction","injury"],"privacy":"approximate","priority":false,"positive":false,"aliases":[]}'::jsonb);
insert into observation_catalog_types(version,id,definition) values (1,'vehicle_obstruction','{"id":"vehicle_obstruction","label":"Vehicle obstructing traffic","title":"Vehicle obstructing traffic","family":"travel","color":"#7fb0fc","legacyCategory":"Travel","legacyKind":"road","questions":["access_impact","direction","injury"],"privacy":"approximate","priority":false,"positive":false,"aliases":[]}'::jsonb);
insert into observation_catalog_types(version,id,definition) values (1,'traffic_delay','{"id":"traffic_delay","label":"Traffic delay","title":"Traffic delay","family":"travel","color":"#7fb0fc","legacyCategory":"Travel","legacyKind":"road","questions":["access_impact","direction","observation_basis"],"privacy":"approximate","priority":false,"positive":false,"aliases":[]}'::jsonb);
insert into observation_catalog_types(version,id,definition) values (1,'closure','{"id":"closure","label":"Closure reported","title":"Closure reported","family":"travel","color":"#7fb0fc","legacyCategory":"Travel","legacyKind":"road","questions":["access_impact","direction","observation_basis"],"privacy":"approximate","priority":false,"positive":false,"aliases":[]}'::jsonb);
insert into observation_catalog_types(version,id,definition) values (1,'blocked_access','{"id":"blocked_access","label":"Blocked access","title":"Blocked access","family":"travel","color":"#7fb0fc","legacyCategory":"Travel","legacyKind":"road","questions":["access_impact","direction","observation_basis"],"privacy":"approximate","priority":false,"positive":false,"aliases":[]}'::jsonb);
insert into observation_catalog_types(version,id,definition) values (1,'damaged_bridge','{"id":"damaged_bridge","label":"Damaged bridge","title":"Damaged bridge","family":"travel","color":"#7fb0fc","legacyCategory":"Travel","legacyKind":"road","questions":["access_impact","direction","observation_basis"],"privacy":"approximate","priority":false,"positive":false,"aliases":[]}'::jsonb);
insert into observation_catalog_types(version,id,definition) values (1,'construction','{"id":"construction","label":"Construction or detour observed","title":"Construction or detour observed","family":"travel","color":"#7fb0fc","legacyCategory":"Travel","legacyKind":"road","questions":["access_impact","direction","observation_basis"],"privacy":"approximate","priority":false,"positive":false,"aliases":[]}'::jsonb);
insert into observation_catalog_types(version,id,definition) values (1,'transit_delay','{"id":"transit_delay","label":"Transit delay observed","title":"Transit delay observed","family":"travel","color":"#7fb0fc","legacyCategory":"Travel","legacyKind":"road","questions":["access_impact","direction","observation_basis"],"privacy":"approximate","priority":false,"positive":false,"aliases":[]}'::jsonb);
insert into observation_catalog_types(version,id,definition) values (1,'ferry_disruption','{"id":"ferry_disruption","label":"Ferry disruption observed","title":"Ferry disruption observed","family":"travel","color":"#7fb0fc","legacyCategory":"Travel","legacyKind":"road","questions":["access_impact","direction","observation_basis"],"privacy":"approximate","priority":false,"positive":false,"aliases":[]}'::jsonb);
insert into observation_catalog_types(version,id,definition) values (1,'airport_disruption','{"id":"airport_disruption","label":"Airport disruption observed","title":"Airport disruption observed","family":"travel","color":"#7fb0fc","legacyCategory":"Travel","legacyKind":"road","questions":["access_impact","direction","observation_basis"],"privacy":"approximate","priority":false,"positive":false,"aliases":[]}'::jsonb);
insert into observation_catalog_types(version,id,definition) values (1,'parking_issue','{"id":"parking_issue","label":"Parking or access issue","title":"Parking or access issue","family":"travel","color":"#7fb0fc","legacyCategory":"Travel","legacyKind":"road","questions":["access_impact","direction","observation_basis"],"privacy":"approximate","priority":false,"positive":false,"aliases":[]}'::jsonb);
insert into observation_catalog_types(version,id,definition) values (1,'animal_sighting','{"id":"animal_sighting","label":"Animal sighting","title":"Animal sighting","family":"wildlife","color":"#79d5a5","legacyCategory":"Outdoors","legacyKind":"wildlife","questions":["animal","other_animal","count","sighting_behavior"],"privacy":"approximate","priority":false,"positive":false,"aliases":["bear","moose","beluga","whale","seal","bird","caribou","fox","wolf"]}'::jsonb);
insert into observation_catalog_types(version,id,definition) values (1,'animal_encounter','{"id":"animal_encounter","label":"Wildlife encounter","title":"Wildlife encounter","family":"wildlife","color":"#79d5a5","legacyCategory":"Outdoors","legacyKind":"wildlife","questions":["animal","other_animal","count","encounter_behavior","injury","location_context"],"privacy":"coarse","priority":false,"positive":false,"aliases":["bear encounter","attack","aggressive animal"]}'::jsonb);
insert into observation_catalog_types(version,id,definition) values (1,'animal_welfare','{"id":"animal_welfare","label":"Animal welfare concern","title":"Animal welfare concern","family":"wildlife","color":"#79d5a5","legacyCategory":"Outdoors","legacyKind":"wildlife","questions":["animal","other_animal","count","animal_condition","location_context"],"privacy":"coarse","priority":false,"positive":false,"aliases":["stranded whale","injured animal","entanglement"]}'::jsonb);
insert into observation_catalog_types(version,id,definition) values (1,'loose_animal','{"id":"loose_animal","label":"Loose domestic animal","title":"Loose domestic animal","family":"wildlife","color":"#79d5a5","legacyCategory":"Outdoors","legacyKind":"wildlife","questions":["animal","other_animal","count","location_context"],"privacy":"coarse","priority":false,"positive":false,"aliases":[]}'::jsonb);
insert into observation_catalog_types(version,id,definition) values (1,'lost_pet','{"id":"lost_pet","label":"Lost pet information","title":"Lost pet information","family":"wildlife","color":"#79d5a5","legacyCategory":"Outdoors","legacyKind":"wildlife","questions":["animal","other_animal","count","location_context"],"privacy":"coarse","priority":false,"positive":false,"aliases":[]}'::jsonb);
insert into observation_catalog_types(version,id,definition) values (1,'found_pet','{"id":"found_pet","label":"Found pet information","title":"Found pet information","family":"wildlife","color":"#79d5a5","legacyCategory":"Outdoors","legacyKind":"wildlife","questions":["animal","other_animal","count","location_context"],"privacy":"coarse","priority":false,"positive":false,"aliases":[]}'::jsonb);
insert into observation_catalog_types(version,id,definition) values (1,'livestock','{"id":"livestock","label":"Livestock near road","title":"Livestock near road","family":"wildlife","color":"#79d5a5","legacyCategory":"Outdoors","legacyKind":"wildlife","questions":["animal","other_animal","count","location_context"],"privacy":"coarse","priority":false,"positive":false,"aliases":[]}'::jsonb);
insert into observation_catalog_types(version,id,definition) values (1,'trail_condition','{"id":"trail_condition","label":"Trail condition","title":"Trail condition","family":"outdoors","color":"#55c9bd","legacyCategory":"Outdoors","legacyKind":"trail","questions":["outdoor_condition","access_impact","location_context"],"privacy":"approximate","priority":false,"positive":false,"aliases":[]}'::jsonb);
insert into observation_catalog_types(version,id,definition) values (1,'trail_erosion','{"id":"trail_erosion","label":"Trail erosion","title":"Trail erosion","family":"outdoors","color":"#55c9bd","legacyCategory":"Outdoors","legacyKind":"trail","questions":["outdoor_condition","access_impact","location_context"],"privacy":"approximate","priority":false,"positive":false,"aliases":[]}'::jsonb);
insert into observation_catalog_types(version,id,definition) values (1,'damaged_trail','{"id":"damaged_trail","label":"Damaged trail","title":"Damaged trail","family":"outdoors","color":"#55c9bd","legacyCategory":"Outdoors","legacyKind":"trail","questions":["outdoor_condition","access_impact","location_context"],"privacy":"approximate","priority":false,"positive":false,"aliases":[]}'::jsonb);
insert into observation_catalog_types(version,id,definition) values (1,'difficult_crossing','{"id":"difficult_crossing","label":"Difficult crossing","title":"Difficult crossing","family":"outdoors","color":"#55c9bd","legacyCategory":"Outdoors","legacyKind":"trail","questions":["outdoor_condition","access_impact","location_context"],"privacy":"approximate","priority":false,"positive":false,"aliases":[]}'::jsonb);
insert into observation_catalog_types(version,id,definition) values (1,'damaged_sign','{"id":"damaged_sign","label":"Damaged sign","title":"Damaged sign","family":"outdoors","color":"#55c9bd","legacyCategory":"Outdoors","legacyKind":"trail","questions":["outdoor_condition","access_impact","location_context"],"privacy":"approximate","priority":false,"positive":false,"aliases":[]}'::jsonb);
insert into observation_catalog_types(version,id,definition) values (1,'recreation_condition','{"id":"recreation_condition","label":"Recreation condition","title":"Recreation condition","family":"outdoors","color":"#55c9bd","legacyCategory":"Outdoors","legacyKind":"trail","questions":["outdoor_condition","access_impact","location_context"],"privacy":"approximate","priority":false,"positive":false,"aliases":[]}'::jsonb);
insert into observation_catalog_types(version,id,definition) values (1,'campsite','{"id":"campsite","label":"Campsite condition","title":"Campsite condition","family":"outdoors","color":"#55c9bd","legacyCategory":"Outdoors","legacyKind":"trail","questions":["outdoor_condition","access_impact","location_context"],"privacy":"approximate","priority":false,"positive":false,"aliases":[]}'::jsonb);
insert into observation_catalog_types(version,id,definition) values (1,'public_facility','{"id":"public_facility","label":"Public facility issue","title":"Public facility issue","family":"outdoors","color":"#55c9bd","legacyCategory":"Outdoors","legacyKind":"trail","questions":["outdoor_condition","access_impact","location_context"],"privacy":"approximate","priority":false,"positive":false,"aliases":[]}'::jsonb);
insert into observation_catalog_types(version,id,definition) values (1,'accessible_route','{"id":"accessible_route","label":"Accessible route segment observed","title":"Accessible route segment observed","family":"outdoors","color":"#55c9bd","legacyCategory":"Outdoors","legacyKind":"trail","questions":["accessibility","location_context"],"privacy":"approximate","priority":false,"positive":true,"aliases":[]}'::jsonb);
insert into observation_catalog_types(version,id,definition) values (1,'clear_trail','{"id":"clear_trail","label":"Clear trail segment observed","title":"Clear trail segment observed","family":"outdoors","color":"#55c9bd","legacyCategory":"Outdoors","legacyKind":"trail","questions":["access_impact"],"privacy":"approximate","priority":false,"positive":true,"aliases":[]}'::jsonb);
insert into observation_catalog_types(version,id,definition) values (1,'facility_available','{"id":"facility_available","label":"Public facility available observed","title":"Public facility available observed","family":"community","color":"#bbc3d1","legacyCategory":"Safety","legacyKind":"hazard","questions":["service_state","accessibility"],"privacy":"approximate","priority":false,"positive":true,"aliases":[]}'::jsonb);
insert into observation_catalog_types(version,id,definition) values (1,'strong_wind','{"id":"strong_wind","label":"Strong wind observed","title":"Strong wind observed","family":"weather","color":"#8ccce8","legacyCategory":"Safety","legacyKind":"hazard","questions":["location_context","access_impact"],"privacy":"approximate","priority":false,"positive":false,"aliases":[]}'::jsonb);
insert into observation_catalog_types(version,id,definition) values (1,'heavy_rain','{"id":"heavy_rain","label":"Heavy rain","title":"Heavy rain","family":"weather","color":"#8ccce8","legacyCategory":"Safety","legacyKind":"hazard","questions":["location_context","access_impact"],"privacy":"approximate","priority":false,"positive":false,"aliases":[]}'::jsonb);
insert into observation_catalog_types(version,id,definition) values (1,'snowfall','{"id":"snowfall","label":"Snowfall","title":"Snowfall","family":"weather","color":"#8ccce8","legacyCategory":"Safety","legacyKind":"hazard","questions":["location_context","access_impact"],"privacy":"approximate","priority":false,"positive":false,"aliases":[]}'::jsonb);
insert into observation_catalog_types(version,id,definition) values (1,'hail','{"id":"hail","label":"Hail","title":"Hail","family":"weather","color":"#8ccce8","legacyCategory":"Safety","legacyKind":"hazard","questions":["location_context","access_impact"],"privacy":"approximate","priority":false,"positive":false,"aliases":[]}'::jsonb);
insert into observation_catalog_types(version,id,definition) values (1,'lightning','{"id":"lightning","label":"Lightning observed","title":"Lightning observed","family":"weather","color":"#8ccce8","legacyCategory":"Safety","legacyKind":"hazard","questions":["location_context","access_impact"],"privacy":"approximate","priority":false,"positive":false,"aliases":[]}'::jsonb);
insert into observation_catalog_types(version,id,definition) values (1,'temperature','{"id":"temperature","label":"Temperature-related condition","title":"Temperature-related condition","family":"weather","color":"#8ccce8","legacyCategory":"Safety","legacyKind":"hazard","questions":["location_context","access_impact"],"privacy":"approximate","priority":false,"positive":false,"aliases":[]}'::jsonb);
insert into observation_catalog_types(version,id,definition) values (1,'high_water','{"id":"high_water","label":"High water","title":"High water","family":"weather","color":"#8ccce8","legacyCategory":"Safety","legacyKind":"hazard","questions":["location_context","access_impact"],"privacy":"approximate","priority":false,"positive":false,"aliases":[]}'::jsonb);
insert into observation_catalog_types(version,id,definition) values (1,'unusual_water','{"id":"unusual_water","label":"Unusual water level","title":"Unusual water level","family":"weather","color":"#8ccce8","legacyCategory":"Safety","legacyKind":"hazard","questions":["location_context","access_impact"],"privacy":"approximate","priority":false,"positive":false,"aliases":[]}'::jsonb);
insert into observation_catalog_types(version,id,definition) values (1,'unsafe_ice','{"id":"unsafe_ice","label":"Unsafe ice observed","title":"Unsafe ice observed","family":"weather","color":"#8ccce8","legacyCategory":"Safety","legacyKind":"hazard","questions":["location_context","access_impact"],"privacy":"approximate","priority":false,"positive":false,"aliases":[]}'::jsonb);
insert into observation_catalog_types(version,id,definition) values (1,'river_ice','{"id":"river_ice","label":"River or lake ice condition","title":"River or lake ice condition","family":"weather","color":"#8ccce8","legacyCategory":"Safety","legacyKind":"hazard","questions":["location_context","access_impact"],"privacy":"approximate","priority":false,"positive":false,"aliases":[]}'::jsonb);
insert into observation_catalog_types(version,id,definition) values (1,'coastal_flooding','{"id":"coastal_flooding","label":"Coastal flooding","title":"Coastal flooding","family":"weather","color":"#8ccce8","legacyCategory":"Safety","legacyKind":"hazard","questions":["location_context","access_impact"],"privacy":"approximate","priority":false,"positive":false,"aliases":[]}'::jsonb);
insert into observation_catalog_types(version,id,definition) values (1,'hazardous_surf','{"id":"hazardous_surf","label":"Hazardous surf observed","title":"Hazardous surf observed","family":"weather","color":"#8ccce8","legacyCategory":"Safety","legacyKind":"hazard","questions":["location_context","access_impact"],"privacy":"approximate","priority":false,"positive":false,"aliases":[]}'::jsonb);
insert into observation_catalog_types(version,id,definition) values (1,'avalanche','{"id":"avalanche","label":"Avalanche observed","title":"Avalanche observed","family":"weather","color":"#8ccce8","legacyCategory":"Safety","legacyKind":"hazard","questions":["location_context","access_impact"],"privacy":"approximate","priority":true,"positive":false,"aliases":["snow slide"]}'::jsonb);
insert into observation_catalog_types(version,id,definition) values (1,'slide_debris','{"id":"slide_debris","label":"Snow-slide debris","title":"Snow-slide debris","family":"weather","color":"#8ccce8","legacyCategory":"Safety","legacyKind":"hazard","questions":["location_context","access_impact"],"privacy":"approximate","priority":false,"positive":false,"aliases":[]}'::jsonb);
insert into observation_catalog_types(version,id,definition) values (1,'landslide','{"id":"landslide","label":"Landslide","title":"Landslide","family":"weather","color":"#8ccce8","legacyCategory":"Safety","legacyKind":"hazard","questions":["location_context","access_impact"],"privacy":"approximate","priority":false,"positive":false,"aliases":[]}'::jsonb);
insert into observation_catalog_types(version,id,definition) values (1,'erosion','{"id":"erosion","label":"Erosion","title":"Erosion","family":"weather","color":"#8ccce8","legacyCategory":"Safety","legacyKind":"hazard","questions":["location_context","access_impact"],"privacy":"approximate","priority":false,"positive":false,"aliases":[]}'::jsonb);
insert into observation_catalog_types(version,id,definition) values (1,'ground_movement','{"id":"ground_movement","label":"Ground movement","title":"Ground movement","family":"weather","color":"#8ccce8","legacyCategory":"Safety","legacyKind":"hazard","questions":["location_context","access_impact"],"privacy":"approximate","priority":false,"positive":false,"aliases":[]}'::jsonb);
insert into observation_catalog_types(version,id,definition) values (1,'aurora','{"id":"aurora","label":"Aurora sighting","title":"Aurora sighting","family":"weather","color":"#8ccce8","legacyCategory":"Outdoors","legacyKind":"aurora","questions":[],"privacy":"approximate","priority":false,"positive":true,"aliases":[]}'::jsonb);
insert into observation_catalog_types(version,id,definition) values (1,'sky_observation','{"id":"sky_observation","label":"Sky or seasonal observation","title":"Sky or seasonal observation","family":"discoveries","color":"#d5ca8d","legacyCategory":"Outdoors","legacyKind":"trail","questions":["context_note"],"privacy":"approximate","priority":false,"positive":true,"aliases":[]}'::jsonb);
insert into observation_catalog_types(version,id,definition) values (1,'flames','{"id":"flames","label":"Flames observed","title":"Flames observed","family":"environment","color":"#e7af79","legacyCategory":"Safety","legacyKind":"smoke","questions":["access_impact","location_context"],"privacy":"approximate","priority":true,"positive":false,"aliases":[]}'::jsonb);
insert into observation_catalog_types(version,id,definition) values (1,'unattended_campfire','{"id":"unattended_campfire","label":"Unattended campfire observed","title":"Unattended campfire observed","family":"environment","color":"#e7af79","legacyCategory":"Safety","legacyKind":"smoke","questions":["fire_signs","location_context","observation_basis"],"privacy":"approximate","priority":false,"positive":false,"aliases":[]}'::jsonb);
insert into observation_catalog_types(version,id,definition) values (1,'prescribed_burn','{"id":"prescribed_burn","label":"Reported prescribed-burn activity","title":"Reported prescribed-burn activity","family":"environment","color":"#e7af79","legacyCategory":"Safety","legacyKind":"smoke","questions":["fire_signs","location_context","observation_basis"],"privacy":"approximate","priority":false,"positive":false,"aliases":[]}'::jsonb);
insert into observation_catalog_types(version,id,definition) values (1,'poor_air','{"id":"poor_air","label":"Poor air clarity","title":"Poor air clarity","family":"environment","color":"#e7af79","legacyCategory":"Safety","legacyKind":"smoke","questions":["location_context","observation_basis","context_note"],"privacy":"approximate","priority":false,"positive":false,"aliases":[]}'::jsonb);
insert into observation_catalog_types(version,id,definition) values (1,'odor','{"id":"odor","label":"Unusual odor","title":"Unusual odor","family":"environment","color":"#e7af79","legacyCategory":"Safety","legacyKind":"smoke","questions":["location_context","observation_basis","context_note"],"privacy":"approximate","priority":false,"positive":false,"aliases":[]}'::jsonb);
insert into observation_catalog_types(version,id,definition) values (1,'spill','{"id":"spill","label":"Visible spill","title":"Visible spill","family":"environment","color":"#e7af79","legacyCategory":"Safety","legacyKind":"smoke","questions":["location_context","observation_basis","context_note"],"privacy":"approximate","priority":false,"positive":false,"aliases":[]}'::jsonb);
insert into observation_catalog_types(version,id,definition) values (1,'pollution','{"id":"pollution","label":"Suspected pollution","title":"Suspected pollution","family":"environment","color":"#e7af79","legacyCategory":"Safety","legacyKind":"smoke","questions":["location_context","observation_basis","context_note"],"privacy":"approximate","priority":false,"positive":false,"aliases":[]}'::jsonb);
insert into observation_catalog_types(version,id,definition) values (1,'water_discoloration','{"id":"water_discoloration","label":"Water discoloration","title":"Water discoloration","family":"environment","color":"#e7af79","legacyCategory":"Safety","legacyKind":"smoke","questions":["location_context","observation_basis","context_note"],"privacy":"approximate","priority":false,"positive":false,"aliases":[]}'::jsonb);
insert into observation_catalog_types(version,id,definition) values (1,'dumping','{"id":"dumping","label":"Dumping or litter","title":"Dumping or litter","family":"environment","color":"#e7af79","legacyCategory":"Safety","legacyKind":"smoke","questions":["location_context","observation_basis","context_note"],"privacy":"approximate","priority":false,"positive":false,"aliases":[]}'::jsonb);
insert into observation_catalog_types(version,id,definition) values (1,'habitat_damage','{"id":"habitat_damage","label":"Damaged habitat","title":"Damaged habitat","family":"environment","color":"#e7af79","legacyCategory":"Safety","legacyKind":"smoke","questions":["location_context","observation_basis","context_note"],"privacy":"approximate","priority":false,"positive":false,"aliases":[]}'::jsonb);
insert into observation_catalog_types(version,id,definition) values (1,'power_outage','{"id":"power_outage","label":"Power outage reported","title":"Power outage reported","family":"community","color":"#bbc3d1","legacyCategory":"Safety","legacyKind":"hazard","questions":["service_state","location_context","observation_basis"],"privacy":"approximate","priority":false,"positive":false,"aliases":[]}'::jsonb);
insert into observation_catalog_types(version,id,definition) values (1,'fallen_line','{"id":"fallen_line","label":"Fallen utility line","title":"Fallen utility line","family":"community","color":"#bbc3d1","legacyCategory":"Safety","legacyKind":"hazard","questions":["service_state","location_context","observation_basis"],"privacy":"approximate","priority":true,"positive":false,"aliases":[]}'::jsonb);
insert into observation_catalog_types(version,id,definition) values (1,'damaged_pole','{"id":"damaged_pole","label":"Damaged utility pole","title":"Damaged utility pole","family":"community","color":"#bbc3d1","legacyCategory":"Safety","legacyKind":"hazard","questions":["service_state","location_context","observation_basis"],"privacy":"approximate","priority":false,"positive":false,"aliases":[]}'::jsonb);
insert into observation_catalog_types(version,id,definition) values (1,'water_service','{"id":"water_service","label":"Water-service issue","title":"Water-service issue","family":"community","color":"#bbc3d1","legacyCategory":"Safety","legacyKind":"hazard","questions":["service_state","location_context","observation_basis"],"privacy":"approximate","priority":false,"positive":false,"aliases":[]}'::jsonb);
insert into observation_catalog_types(version,id,definition) values (1,'communications','{"id":"communications","label":"Communications disruption","title":"Communications disruption","family":"community","color":"#bbc3d1","legacyCategory":"Safety","legacyKind":"hazard","questions":["service_state","location_context","observation_basis"],"privacy":"approximate","priority":false,"positive":false,"aliases":[]}'::jsonb);
insert into observation_catalog_types(version,id,definition) values (1,'traffic_signal','{"id":"traffic_signal","label":"Traffic signal or streetlight issue","title":"Traffic signal or streetlight issue","family":"community","color":"#bbc3d1","legacyCategory":"Safety","legacyKind":"hazard","questions":["service_state","location_context","observation_basis"],"privacy":"approximate","priority":false,"positive":false,"aliases":[]}'::jsonb);
insert into observation_catalog_types(version,id,definition) values (1,'sidewalk','{"id":"sidewalk","label":"Sidewalk damage or blockage","title":"Sidewalk damage or blockage","family":"community","color":"#bbc3d1","legacyCategory":"Safety","legacyKind":"hazard","questions":["service_state","location_context","observation_basis"],"privacy":"approximate","priority":false,"positive":false,"aliases":[]}'::jsonb);
insert into observation_catalog_types(version,id,definition) values (1,'drainage','{"id":"drainage","label":"Drainage issue","title":"Drainage issue","family":"community","color":"#bbc3d1","legacyCategory":"Safety","legacyKind":"hazard","questions":["service_state","location_context","observation_basis"],"privacy":"approximate","priority":false,"positive":false,"aliases":[]}'::jsonb);
insert into observation_catalog_types(version,id,definition) values (1,'public_structure','{"id":"public_structure","label":"Damaged public structure","title":"Damaged public structure","family":"community","color":"#bbc3d1","legacyCategory":"Safety","legacyKind":"hazard","questions":["service_state","location_context","observation_basis"],"privacy":"approximate","priority":false,"positive":false,"aliases":[]}'::jsonb);
insert into observation_catalog_types(version,id,definition) values (1,'public_amenity','{"id":"public_amenity","label":"Public amenity issue","title":"Public amenity issue","family":"community","color":"#bbc3d1","legacyCategory":"Safety","legacyKind":"hazard","questions":["service_state","location_context","observation_basis"],"privacy":"approximate","priority":false,"positive":false,"aliases":[]}'::jsonb);
insert into observation_catalog_types(version,id,definition) values (1,'service_interruption','{"id":"service_interruption","label":"Community service interruption","title":"Community service interruption","family":"community","color":"#bbc3d1","legacyCategory":"Safety","legacyKind":"hazard","questions":["service_state","location_context","observation_basis"],"privacy":"approximate","priority":false,"positive":false,"aliases":[]}'::jsonb);
insert into observation_catalog_types(version,id,definition) values (1,'resource_information','{"id":"resource_information","label":"Community resource information","title":"Community resource information","family":"community","color":"#bbc3d1","legacyCategory":"Safety","legacyKind":"hazard","questions":["service_state","location_context","observation_basis"],"privacy":"approximate","priority":false,"positive":true,"aliases":[]}'::jsonb);
insert into observation_catalog_types(version,id,definition) values (1,'accessibility_issue','{"id":"accessibility_issue","label":"Accessibility or entrance issue","title":"Accessibility or entrance issue","family":"community","color":"#bbc3d1","legacyCategory":"Safety","legacyKind":"hazard","questions":["accessibility","location_context"],"privacy":"approximate","priority":false,"positive":false,"aliases":[]}'::jsonb);
insert into observation_catalog_types(version,id,definition) values (1,'gunfire_heard','{"id":"gunfire_heard","label":"Possible gunfire heard","title":"Possible gunfire heard","family":"safety","color":"#bda9dc","legacyCategory":"Safety","legacyKind":"hazard","questions":["observation_basis","injury","location_context"],"privacy":"restricted","priority":false,"positive":false,"aliases":[]}'::jsonb);
insert into observation_catalog_types(version,id,definition) values (1,'shooting_witnessed','{"id":"shooting_witnessed","label":"Shooting witnessed","title":"Shooting witnessed","family":"safety","color":"#bda9dc","legacyCategory":"Safety","legacyKind":"hazard","questions":["observation_basis","injury","location_context"],"privacy":"restricted","priority":true,"positive":false,"aliases":["shooting","injuries"]}'::jsonb);
insert into observation_catalog_types(version,id,definition) values (1,'police_presence','{"id":"police_presence","label":"Police presence","title":"Police presence","family":"safety","color":"#bda9dc","legacyCategory":"Safety","legacyKind":"hazard","questions":["observation_basis","injury","location_context"],"privacy":"restricted","priority":false,"positive":false,"aliases":[]}'::jsonb);
insert into observation_catalog_types(version,id,definition) values (1,'emergency_response','{"id":"emergency_response","label":"Emergency response observed","title":"Emergency response observed","family":"safety","color":"#bda9dc","legacyCategory":"Safety","legacyKind":"hazard","questions":["observation_basis","injury","location_context"],"privacy":"restricted","priority":false,"positive":false,"aliases":[]}'::jsonb);
insert into observation_catalog_types(version,id,definition) values (1,'disturbance','{"id":"disturbance","label":"Disturbance observed","title":"Disturbance observed","family":"safety","color":"#bda9dc","legacyCategory":"Safety","legacyKind":"hazard","questions":["observation_basis","injury","location_context"],"privacy":"restricted","priority":false,"positive":false,"aliases":[]}'::jsonb);
insert into observation_catalog_types(version,id,definition) values (1,'injury_assistance','{"id":"injury_assistance","label":"Injury or assistance concern","title":"Injury or assistance concern","family":"safety","color":"#bda9dc","legacyCategory":"Safety","legacyKind":"hazard","questions":["observation_basis","injury","location_context"],"privacy":"restricted","priority":true,"positive":false,"aliases":[]}'::jsonb);
insert into observation_catalog_types(version,id,definition) values (1,'stranded_traveler','{"id":"stranded_traveler","label":"Stranded traveler","title":"Stranded traveler","family":"safety","color":"#bda9dc","legacyCategory":"Safety","legacyKind":"hazard","questions":["observation_basis","injury","location_context"],"privacy":"restricted","priority":false,"positive":false,"aliases":[]}'::jsonb);
insert into observation_catalog_types(version,id,definition) values (1,'missing_person','{"id":"missing_person","label":"Missing-person information","title":"Missing-person information","family":"safety","color":"#bda9dc","legacyCategory":"Safety","legacyKind":"hazard","questions":["observation_basis","injury","location_context"],"privacy":"restricted","priority":true,"positive":false,"aliases":[]}'::jsonb);
insert into observation_catalog_types(version,id,definition) values (1,'vulnerable_person','{"id":"vulnerable_person","label":"Vulnerable-person concern","title":"Vulnerable-person concern","family":"safety","color":"#bda9dc","legacyCategory":"Safety","legacyKind":"hazard","questions":["observation_basis","injury","location_context"],"privacy":"restricted","priority":true,"positive":false,"aliases":[]}'::jsonb);
insert into observation_catalog_types(version,id,definition) values (1,'scenic_discovery','{"id":"scenic_discovery","label":"Scenic or natural discovery","title":"Scenic or natural discovery","family":"discoveries","color":"#d5ca8d","legacyCategory":"Outdoors","legacyKind":"trail","questions":["context_note","observation_basis"],"privacy":"approximate","priority":false,"positive":true,"aliases":[]}'::jsonb);
insert into observation_catalog_types(version,id,definition) values (1,'seasonal_observation','{"id":"seasonal_observation","label":"Seasonal observation","title":"Seasonal observation","family":"discoveries","color":"#d5ca8d","legacyCategory":"Outdoors","legacyKind":"trail","questions":["context_note","observation_basis"],"privacy":"approximate","priority":false,"positive":true,"aliases":[]}'::jsonb);
insert into observation_catalog_types(version,id,definition) values (1,'local_activity','{"id":"local_activity","label":"Local event or activity observed","title":"Local event or activity observed","family":"discoveries","color":"#d5ca8d","legacyCategory":"Outdoors","legacyKind":"trail","questions":["context_note","observation_basis"],"privacy":"approximate","priority":false,"positive":true,"aliases":[]}'::jsonb);
insert into observation_catalog_types(version,id,definition) values (1,'useful_update','{"id":"useful_update","label":"Useful public-place update","title":"Useful public-place update","family":"discoveries","color":"#d5ca8d","legacyCategory":"Outdoors","legacyKind":"trail","questions":["context_note","observation_basis"],"privacy":"approximate","priority":false,"positive":true,"aliases":[]}'::jsonb);
insert into observation_catalog_types(version,id,definition) values (1,'other','{"id":"other","label":"Other observation","title":"Other observation","family":"discoveries","color":"#d5ca8d","legacyCategory":"Outdoors","legacyKind":"trail","questions":["context_note","observation_basis"],"privacy":"approximate","priority":false,"positive":false,"aliases":[]}'::jsonb);
insert into observation_catalog_questions(version,id,definition) values (1,'animal','{"id":"animal","label":"What animal?","type":"choice","options":[{"value":"bear","label":"Bear"},{"value":"moose","label":"Moose"},{"value":"caribou","label":"Caribou / reindeer"},{"value":"wolf_coyote","label":"Wolf / coyote"},{"value":"fox","label":"Fox"},{"value":"beluga","label":"Beluga"},{"value":"whale","label":"Other whale"},{"value":"seal_sea_lion","label":"Seal / sea lion"},{"value":"bird","label":"Bird"},{"value":"other","label":"Other animal"},{"value":"unknown","label":"Not sure"}]}'::jsonb);
insert into observation_catalog_questions(version,id,definition) values (1,'other_animal','{"id":"other_animal","label":"Other animal","type":"text","options":[],"maxLength":80,"showWhen":{"field":"animal","values":["other"]}}'::jsonb);
insert into observation_catalog_questions(version,id,definition) values (1,'count','{"id":"count","label":"Roughly how many?","type":"number","options":[],"min":1,"max":10000}'::jsonb);
insert into observation_catalog_questions(version,id,definition) values (1,'sighting_behavior','{"id":"sighting_behavior","label":"What was the animal doing?","type":"choice","options":[{"value":"passing","label":"Passing"},{"value":"feeding","label":"Feeding"},{"value":"crossing_road","label":"Crossing road"},{"value":"near_trail","label":"Near trail"},{"value":"nesting","label":"Nesting"},{"value":"denning","label":"Denning"},{"value":"unknown","label":"Unknown"}],"coarseValues":["nesting","denning"]}'::jsonb);
insert into observation_catalog_questions(version,id,definition) values (1,'encounter_behavior','{"id":"encounter_behavior","label":"What did you observe?","type":"choice","options":[{"value":"near_people","label":"Near people"},{"value":"defensive","label":"Defensive behavior"},{"value":"aggressive","label":"Aggressive behavior"},{"value":"attack","label":"Attack reported"},{"value":"unknown","label":"Not sure"}],"reviewValues":["attack"],"priorityValues":["attack"]}'::jsonb);
insert into observation_catalog_questions(version,id,definition) values (1,'animal_condition','{"id":"animal_condition","label":"What condition did you observe?","type":"choice","options":[{"value":"injured","label":"Injured"},{"value":"stranded","label":"Stranded"},{"value":"dead","label":"Dead"},{"value":"entangled","label":"Entangled"},{"value":"unknown","label":"Unknown"}],"coarseValues":["injured","stranded","entangled"]}'::jsonb);
insert into observation_catalog_questions(version,id,definition) values (1,'surface','{"id":"surface","label":"Road surface","type":"choice","options":[{"value":"dry","label":"Dry"},{"value":"wet","label":"Wet"},{"value":"snow","label":"Snow"},{"value":"slush","label":"Slush"},{"value":"ice","label":"Ice"},{"value":"black_ice","label":"Black ice"},{"value":"unknown","label":"Unknown"}]}'::jsonb);
insert into observation_catalog_questions(version,id,definition) values (1,'visibility','{"id":"visibility","label":"Visibility","type":"choice","options":[{"value":"good","label":"Good"},{"value":"reduced","label":"Reduced"},{"value":"very_poor","label":"Very poor"},{"value":"unknown","label":"Unknown"}]}'::jsonb);
insert into observation_catalog_questions(version,id,definition) values (1,'direction','{"id":"direction","label":"Which direction or area?","type":"text","options":[],"maxLength":100}'::jsonb);
insert into observation_catalog_questions(version,id,definition) values (1,'access_impact','{"id":"access_impact","label":"Effect on access","type":"choice","options":[{"value":"passable","label":"Passable"},{"value":"partly_blocked","label":"Partly blocked"},{"value":"blocked","label":"Blocked"},{"value":"unknown","label":"Unknown"}]}'::jsonb);
insert into observation_catalog_questions(version,id,definition) values (1,'injury','{"id":"injury","label":"Did you directly observe an injury to a person?","type":"choice","options":[{"value":"observed","label":"Injury observed"},{"value":"not_observed","label":"No injury observed"},{"value":"unknown","label":"Not sure"}],"reviewValues":["observed"],"priorityValues":["observed"]}'::jsonb);
insert into observation_catalog_questions(version,id,definition) values (1,'fire_signs','{"id":"fire_signs","label":"What could you see?","type":"choice","options":[{"value":"smoke","label":"Smoke"},{"value":"flames","label":"Flames"},{"value":"both","label":"Both"},{"value":"unknown","label":"Unknown"}]}'::jsonb);
insert into observation_catalog_questions(version,id,definition) values (1,'location_context','{"id":"location_context","label":"General setting","type":"choice","options":[{"value":"public_road","label":"Public road"},{"value":"trail","label":"Trail"},{"value":"park","label":"Park"},{"value":"public_facility","label":"Public facility"},{"value":"shoreline","label":"Shoreline"},{"value":"other","label":"Other"},{"value":"unknown","label":"Unknown"}]}'::jsonb);
insert into observation_catalog_questions(version,id,definition) values (1,'outdoor_condition','{"id":"outdoor_condition","label":"What condition did you observe?","type":"choice","options":[{"value":"ice","label":"Ice"},{"value":"deep_snow","label":"Deep snow"},{"value":"mud","label":"Mud"},{"value":"damaged_surface","label":"Damaged surface"},{"value":"other","label":"Other"},{"value":"unknown","label":"Unknown"}]}'::jsonb);
insert into observation_catalog_questions(version,id,definition) values (1,'service_state','{"id":"service_state","label":"What did you observe?","type":"choice","options":[{"value":"interrupted","label":"Interrupted"},{"value":"partly_available","label":"Partly available"},{"value":"available","label":"Available"},{"value":"unknown","label":"Unknown"}]}'::jsonb);
insert into observation_catalog_questions(version,id,definition) values (1,'accessibility','{"id":"accessibility","label":"What did you observe?","type":"choice","options":[{"value":"blocked","label":"Access blocked"},{"value":"barrier","label":"A barrier"},{"value":"accessible_segment","label":"Accessible segment observed"},{"value":"unknown","label":"Not sure"}]}'::jsonb);
insert into observation_catalog_questions(version,id,definition) values (1,'observation_basis','{"id":"observation_basis","label":"How do you know?","type":"choice","options":[{"value":"firsthand","label":"I observed it"},{"value":"secondhand","label":"Someone told me"},{"value":"source","label":"A published source"},{"value":"unknown","label":"Not sure"}]}'::jsonb);
insert into observation_catalog_questions(version,id,definition) values (1,'context_note','{"id":"context_note","label":"Additional observation details","type":"text","options":[],"maxLength":240}'::jsonb);
insert into observation_catalog_topics(version,id,domain_id,definition) values (1,'travel.surface','travel','{"id":"travel.surface","domainId":"travel","label":"Road conditions","typeIds":["road_condition","black_ice","snow_slush","pothole","washout","flooding","debris","rockfall","fallen_tree","other"]}'::jsonb);
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'travel.surface','road_condition');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'travel.surface','black_ice');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'travel.surface','snow_slush');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'travel.surface','pothole');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'travel.surface','washout');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'travel.surface','flooding');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'travel.surface','debris');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'travel.surface','rockfall');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'travel.surface','fallen_tree');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'travel.surface','other');
insert into observation_catalog_topics(version,id,domain_id,definition) values (1,'travel.visibility','travel','{"id":"travel.visibility","domainId":"travel","label":"Visibility & weather","typeIds":["whiteout","fog","blowing_snow","poor_visibility","smoke","other"]}'::jsonb);
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'travel.visibility','whiteout');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'travel.visibility','fog');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'travel.visibility','blowing_snow');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'travel.visibility','poor_visibility');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'travel.visibility','smoke');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'travel.visibility','other');
insert into observation_catalog_topics(version,id,domain_id,definition) values (1,'travel.vehicle','travel','{"id":"travel.vehicle","domainId":"travel","label":"Vehicle incident","typeIds":["collision","vehicle_off_road","disabled_vehicle","vehicle_obstruction","other"]}'::jsonb);
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'travel.vehicle','collision');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'travel.vehicle','vehicle_off_road');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'travel.vehicle','disabled_vehicle');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'travel.vehicle','vehicle_obstruction');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'travel.vehicle','other');
insert into observation_catalog_topics(version,id,domain_id,definition) values (1,'travel.disruption','travel','{"id":"travel.disruption","domainId":"travel","label":"Access & disruption","typeIds":["traffic_delay","closure","blocked_access","damaged_bridge","construction","other"]}'::jsonb);
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'travel.disruption','traffic_delay');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'travel.disruption','closure');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'travel.disruption','blocked_access');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'travel.disruption','damaged_bridge');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'travel.disruption','construction');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'travel.disruption','other');
insert into observation_catalog_topics(version,id,domain_id,definition) values (1,'travel.transport','travel','{"id":"travel.transport","domainId":"travel","label":"Other transportation","typeIds":["transit_delay","ferry_disruption","airport_disruption","parking_issue","other"]}'::jsonb);
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'travel.transport','transit_delay');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'travel.transport','ferry_disruption');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'travel.transport','airport_disruption');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'travel.transport','parking_issue');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'travel.transport','other');
insert into observation_catalog_topics(version,id,domain_id,definition) values (1,'wildlife.sighting','wildlife','{"id":"wildlife.sighting","domainId":"wildlife","label":"Animal sighting","typeIds":["animal_sighting","other"]}'::jsonb);
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'wildlife.sighting','animal_sighting');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'wildlife.sighting','other');
insert into observation_catalog_topics(version,id,domain_id,definition) values (1,'wildlife.encounter','wildlife','{"id":"wildlife.encounter","domainId":"wildlife","label":"Wildlife encounter","typeIds":["animal_encounter","other"]}'::jsonb);
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'wildlife.encounter','animal_encounter');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'wildlife.encounter','other');
insert into observation_catalog_topics(version,id,domain_id,definition) values (1,'wildlife.welfare','wildlife','{"id":"wildlife.welfare","domainId":"wildlife","label":"Animal welfare","typeIds":["animal_welfare","other"],"privacyFloor":"coarse"}'::jsonb);
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'wildlife.welfare','animal_welfare');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'wildlife.welfare','other');
insert into observation_catalog_topics(version,id,domain_id,definition) values (1,'wildlife.domestic','wildlife','{"id":"wildlife.domestic","domainId":"wildlife","label":"Domestic animals","typeIds":["loose_animal","lost_pet","found_pet","livestock","other"],"privacyFloor":"coarse"}'::jsonb);
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'wildlife.domestic','loose_animal');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'wildlife.domestic','lost_pet');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'wildlife.domestic','found_pet');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'wildlife.domestic','livestock');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'wildlife.domestic','other');
insert into observation_catalog_topics(version,id,domain_id,definition) values (1,'outdoors.trail','outdoors','{"id":"outdoors.trail","domainId":"outdoors","label":"Trail conditions","typeIds":["trail_condition","fallen_tree","trail_erosion","damaged_trail","difficult_crossing","debris","other"]}'::jsonb);
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'outdoors.trail','trail_condition');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'outdoors.trail','fallen_tree');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'outdoors.trail','trail_erosion');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'outdoors.trail','damaged_trail');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'outdoors.trail','difficult_crossing');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'outdoors.trail','debris');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'outdoors.trail','other');
insert into observation_catalog_topics(version,id,domain_id,definition) values (1,'outdoors.access','outdoors','{"id":"outdoors.access","domainId":"outdoors","label":"Access & facilities","typeIds":["blocked_access","parking_issue","campsite","damaged_sign","public_facility","accessibility_issue","other"]}'::jsonb);
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'outdoors.access','blocked_access');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'outdoors.access','parking_issue');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'outdoors.access','campsite');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'outdoors.access','damaged_sign');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'outdoors.access','public_facility');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'outdoors.access','accessibility_issue');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'outdoors.access','other');
insert into observation_catalog_topics(version,id,domain_id,definition) values (1,'outdoors.recreation','outdoors','{"id":"outdoors.recreation","domainId":"outdoors","label":"Recreation conditions","typeIds":["recreation_condition","river_ice","hazardous_surf","avalanche","other"]}'::jsonb);
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'outdoors.recreation','recreation_condition');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'outdoors.recreation','river_ice');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'outdoors.recreation','hazardous_surf');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'outdoors.recreation','avalanche');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'outdoors.recreation','other');
insert into observation_catalog_topics(version,id,domain_id,definition) values (1,'outdoors.useful','outdoors','{"id":"outdoors.useful","domainId":"outdoors","label":"Useful outdoor observations","typeIds":["accessible_route","clear_trail","facility_available","other"]}'::jsonb);
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'outdoors.useful','accessible_route');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'outdoors.useful','clear_trail');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'outdoors.useful','facility_available');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'outdoors.useful','other');
insert into observation_catalog_topics(version,id,domain_id,definition) values (1,'weather.weather','weather','{"id":"weather.weather","domainId":"weather","label":"Weather observations","typeIds":["strong_wind","heavy_rain","snowfall","hail","lightning","temperature","other"]}'::jsonb);
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'weather.weather','strong_wind');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'weather.weather','heavy_rain');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'weather.weather','snowfall');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'weather.weather','hail');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'weather.weather','lightning');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'weather.weather','temperature');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'weather.weather','other');
insert into observation_catalog_topics(version,id,domain_id,definition) values (1,'weather.visibility','weather','{"id":"weather.visibility","domainId":"weather","label":"Wind & visibility","typeIds":["whiteout","fog","blowing_snow","poor_visibility","smoke","other"]}'::jsonb);
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'weather.visibility','whiteout');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'weather.visibility','fog');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'weather.visibility','blowing_snow');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'weather.visibility','poor_visibility');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'weather.visibility','smoke');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'weather.visibility','other');
insert into observation_catalog_topics(version,id,domain_id,definition) values (1,'weather.water','weather','{"id":"weather.water","domainId":"weather","label":"Water & ice","typeIds":["flooding","high_water","unusual_water","unsafe_ice","river_ice","coastal_flooding","hazardous_surf","other"]}'::jsonb);
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'weather.water','flooding');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'weather.water','high_water');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'weather.water','unusual_water');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'weather.water','unsafe_ice');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'weather.water','river_ice');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'weather.water','coastal_flooding');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'weather.water','hazardous_surf');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'weather.water','other');
insert into observation_catalog_topics(version,id,domain_id,definition) values (1,'weather.terrain','weather','{"id":"weather.terrain","domainId":"weather","label":"Terrain, snow & slides","typeIds":["avalanche","slide_debris","rockfall","landslide","erosion","ground_movement","other"]}'::jsonb);
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'weather.terrain','avalanche');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'weather.terrain','slide_debris');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'weather.terrain','rockfall');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'weather.terrain','landslide');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'weather.terrain','erosion');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'weather.terrain','ground_movement');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'weather.terrain','other');
insert into observation_catalog_topics(version,id,domain_id,definition) values (1,'weather.sky','weather','{"id":"weather.sky","domainId":"weather","label":"Sky & seasonal observations","typeIds":["aurora","sky_observation","seasonal_observation","other"]}'::jsonb);
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'weather.sky','aurora');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'weather.sky','sky_observation');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'weather.sky','seasonal_observation');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'weather.sky','other');
insert into observation_catalog_topics(version,id,domain_id,definition) values (1,'environment.fire','environment','{"id":"environment.fire","domainId":"environment","label":"Fire & smoke","typeIds":["smoke","flames","unattended_campfire","prescribed_burn","other"]}'::jsonb);
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'environment.fire','smoke');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'environment.fire','flames');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'environment.fire','unattended_campfire');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'environment.fire','prescribed_burn');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'environment.fire','other');
insert into observation_catalog_topics(version,id,domain_id,definition) values (1,'environment.air','environment','{"id":"environment.air","domainId":"environment","label":"Air observations","typeIds":["poor_air","odor","smoke","other"]}'::jsonb);
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'environment.air','poor_air');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'environment.air','odor');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'environment.air','smoke');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'environment.air','other');
insert into observation_catalog_topics(version,id,domain_id,definition) values (1,'environment.water','environment','{"id":"environment.water","domainId":"environment","label":"Water & environment","typeIds":["spill","pollution","water_discoloration","dumping","habitat_damage","other"]}'::jsonb);
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'environment.water','spill');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'environment.water','pollution');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'environment.water','water_discoloration');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'environment.water','dumping');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'environment.water','habitat_damage');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'environment.water','other');
insert into observation_catalog_topics(version,id,domain_id,definition) values (1,'community.utilities','community','{"id":"community.utilities","domainId":"community","label":"Utilities","typeIds":["power_outage","fallen_line","damaged_pole","water_service","communications","other"]}'::jsonb);
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'community.utilities','power_outage');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'community.utilities','fallen_line');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'community.utilities','damaged_pole');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'community.utilities','water_service');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'community.utilities','communications');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'community.utilities','other');
insert into observation_catalog_topics(version,id,domain_id,definition) values (1,'community.infrastructure','community','{"id":"community.infrastructure","domainId":"community","label":"Public infrastructure","typeIds":["traffic_signal","sidewalk","drainage","public_structure","other"]}'::jsonb);
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'community.infrastructure','traffic_signal');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'community.infrastructure','sidewalk');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'community.infrastructure','drainage');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'community.infrastructure','public_structure');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'community.infrastructure','other');
insert into observation_catalog_topics(version,id,domain_id,definition) values (1,'community.amenities','community','{"id":"community.amenities","domainId":"community","label":"Access & amenities","typeIds":["public_amenity","public_facility","accessibility_issue","blocked_access","other"]}'::jsonb);
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'community.amenities','public_amenity');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'community.amenities','public_facility');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'community.amenities','accessibility_issue');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'community.amenities','blocked_access');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'community.amenities','other');
insert into observation_catalog_topics(version,id,domain_id,definition) values (1,'community.services','community','{"id":"community.services","domainId":"community","label":"Community services","typeIds":["service_interruption","resource_information","facility_available","useful_update","other"]}'::jsonb);
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'community.services','service_interruption');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'community.services','resource_information');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'community.services','facility_available');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'community.services','useful_update');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'community.services','other');
insert into observation_catalog_topics(version,id,domain_id,definition) values (1,'safety.public','safety','{"id":"safety.public","domainId":"safety","label":"Public-safety observations","typeIds":["gunfire_heard","shooting_witnessed","police_presence","emergency_response","disturbance","other"]}'::jsonb);
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'safety.public','gunfire_heard');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'safety.public','shooting_witnessed');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'safety.public','police_presence');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'safety.public','emergency_response');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'safety.public','disturbance');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'safety.public','other');
insert into observation_catalog_topics(version,id,domain_id,definition) values (1,'safety.assistance','safety','{"id":"safety.assistance","domainId":"safety","label":"Assistance concerns","typeIds":["injury_assistance","stranded_traveler","other"]}'::jsonb);
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'safety.assistance','injury_assistance');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'safety.assistance','stranded_traveler');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'safety.assistance','other');
insert into observation_catalog_topics(version,id,domain_id,definition) values (1,'safety.restricted','safety','{"id":"safety.restricted","domainId":"safety","label":"Missing or vulnerable person","typeIds":["missing_person","vulnerable_person","other"]}'::jsonb);
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'safety.restricted','missing_person');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'safety.restricted','vulnerable_person');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'safety.restricted','other');
insert into observation_catalog_topics(version,id,domain_id,definition) values (1,'discoveries.local','discoveries','{"id":"discoveries.local","domainId":"discoveries","label":"Local discoveries","typeIds":["scenic_discovery","seasonal_observation","local_activity","useful_update","other"]}'::jsonb);
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'discoveries.local','scenic_discovery');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'discoveries.local','seasonal_observation');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'discoveries.local','local_activity');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'discoveries.local','useful_update');
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'discoveries.local','other');
insert into observation_catalog_topics(version,id,domain_id,definition) values (1,'travel.other','travel','{"id":"travel.other","domainId":"travel","label":"Other observation","typeIds":["other"]}'::jsonb);
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'travel.other','other');
insert into observation_catalog_topics(version,id,domain_id,definition) values (1,'wildlife.other','wildlife','{"id":"wildlife.other","domainId":"wildlife","label":"Other observation","typeIds":["other"]}'::jsonb);
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'wildlife.other','other');
insert into observation_catalog_topics(version,id,domain_id,definition) values (1,'outdoors.other','outdoors','{"id":"outdoors.other","domainId":"outdoors","label":"Other observation","typeIds":["other"]}'::jsonb);
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'outdoors.other','other');
insert into observation_catalog_topics(version,id,domain_id,definition) values (1,'weather.other','weather','{"id":"weather.other","domainId":"weather","label":"Other observation","typeIds":["other"]}'::jsonb);
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'weather.other','other');
insert into observation_catalog_topics(version,id,domain_id,definition) values (1,'environment.other','environment','{"id":"environment.other","domainId":"environment","label":"Other observation","typeIds":["other"]}'::jsonb);
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'environment.other','other');
insert into observation_catalog_topics(version,id,domain_id,definition) values (1,'community.other','community','{"id":"community.other","domainId":"community","label":"Other observation","typeIds":["other"]}'::jsonb);
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'community.other','other');
insert into observation_catalog_topics(version,id,domain_id,definition) values (1,'safety.other','safety','{"id":"safety.other","domainId":"safety","label":"Other observation","typeIds":["other"]}'::jsonb);
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'safety.other','other');
insert into observation_catalog_topics(version,id,domain_id,definition) values (1,'discoveries.other','discoveries','{"id":"discoveries.other","domainId":"discoveries","label":"Other observation","typeIds":["other"]}'::jsonb);
insert into observation_catalog_routes(version,topic_id,type_id) values (1,'discoveries.other','other');
alter table observations add column taxonomy_version integer not null default 1 references observation_catalog_versions;
alter table observations add column domain_id text;
alter table observations add column topic_id text;
alter table observations add column event_type_id text;
alter table observations add column related_type_ids text[] not null default '{}';
alter table observations add column answers jsonb not null default '{}';
alter table observations add column privacy_class text not null default 'approximate' check(privacy_class in ('approximate','coarse','restricted'));
alter table observations add column review_priority text not null default 'normal' check(review_priority in ('normal','priority'));
alter table observations add column privacy_reviewed_at timestamptz;
create function public.legacy_observation_path(old_category text,old_kind text) returns jsonb language sql immutable set search_path=public as $$
 select case old_kind
 when 'wildlife' then '{"domain":"wildlife","topic":"wildlife.sighting","type":"animal_sighting"}'::jsonb
 when 'trail' then '{"domain":"outdoors","topic":"outdoors.trail","type":"trail_condition"}'::jsonb
 when 'aurora' then '{"domain":"weather","topic":"weather.sky","type":"aurora"}'::jsonb
 when 'smoke' then '{"domain":"environment","topic":"environment.fire","type":"smoke"}'::jsonb
 when 'flooding' then '{"domain":"weather","topic":"weather.water","type":"flooding"}'::jsonb
 else case old_category when 'Travel' then '{"domain":"travel","topic":"travel.surface","type":"road_condition"}'::jsonb when 'Outdoors' then '{"domain":"outdoors","topic":"outdoors.other","type":"other"}'::jsonb else '{"domain":"community","topic":"community.other","type":"other"}'::jsonb end end
$$;
create function public.legacy_observation_answers(old_kind text,old_details jsonb) returns jsonb language plpgsql immutable set search_path=public as $$
declare result jsonb:='{}';animal text;
begin
 if old_kind='wildlife' then
  if old_details ? 'animal' then
   animal:=case lower(old_details->>'animal') when 'bear' then 'bear' when 'moose' then 'moose' when 'beluga' then 'beluga' when 'whale' then 'whale' when 'fox' then 'fox' when 'bird' then 'bird' else 'other' end;
   result:=result||jsonb_build_object('animal',animal);
   if animal='other' then result:=result||jsonb_build_object('other_animal',old_details->>'animal');end if;
  end if;
  if old_details ? 'count' then result:=result||jsonb_build_object('count',old_details->'count');end if;
 end if;
 if old_kind='road' then
  if old_details ? 'surface' then result:=result||jsonb_build_object('surface',replace(lower(old_details->>'surface'),' ','_'));end if;
  if old_details ? 'visibility' then result:=result||jsonb_build_object('visibility',replace(lower(old_details->>'visibility'),' ','_'));end if;
 end if;
 return result;
end $$;
-- Backfill without touching old timestamps, ownership, text, status or photo associations.
do $$ begin
 alter table observations disable trigger guard_observation;
 update observations set domain_id=legacy_observation_path(category,kind)->>'domain',topic_id=legacy_observation_path(category,kind)->>'topic',event_type_id=legacy_observation_path(category,kind)->>'type',answers=legacy_observation_answers(kind,details);
 alter table observations enable trigger guard_observation;
end $$;
alter table observations alter column domain_id set not null;
alter table observations alter column topic_id set not null;
alter table observations alter column event_type_id set not null;
alter table observations add foreign key(taxonomy_version,domain_id) references observation_catalog_domains(version,id);
alter table observations add foreign key(taxonomy_version,topic_id,domain_id) references observation_catalog_topics(version,id,domain_id);
alter table observations add foreign key(taxonomy_version,topic_id,event_type_id) references observation_catalog_routes(version,topic_id,type_id);
create function public.catalog_policy(version_id integer,domain_key text,topic_key text,type_key text,related text[],answer_values jsonb) returns jsonb language plpgsql stable security definer set search_path=public as $$
declare domain_def jsonb;topic_def jsonb;type_def jsonb;definition jsonb;field_def jsonb;field_key text;answer jsonb;allowed text[]:='{}';types text[];item text;privacy_rank integer:=0;priority boolean:=false;value_text text;dependency jsonb;
begin
 select d.definition into domain_def from observation_catalog_domains d where d.version=version_id and d.id=domain_key;
 select t.definition into topic_def from observation_catalog_topics t where t.version=version_id and t.id=topic_key and t.domain_id=domain_key;
 select t.definition into type_def from observation_catalog_types t where t.version=version_id and t.id=type_key;
 if domain_def is null or topic_def is null or type_def is null or not exists(select 1 from observation_catalog_routes where version=version_id and topic_id=topic_key and type_id=type_key) then raise exception 'Invalid category, topic or observation';end if;
 if related is null or cardinality(related)>3 or cardinality(related)<>(select count(distinct x) from unnest(related) x) or type_key=any(related) then raise exception 'Choose up to three different related observations';end if;
 if answer_values is null or jsonb_typeof(answer_values)<>'object' or octet_length(answer_values::text)>4000 then raise exception 'Invalid observation answers';end if;
 privacy_rank:=greatest(case domain_def->>'privacyFloor' when 'restricted' then 2 when 'coarse' then 1 else 0 end,case topic_def->>'privacyFloor' when 'restricted' then 2 when 'coarse' then 1 else 0 end);
 types:=array[type_key]||related;
 foreach item in array types loop
  select t.definition into definition from observation_catalog_types t where t.version=version_id and t.id=item;
  if definition is null then raise exception 'Unknown related observation';end if;
  privacy_rank:=greatest(privacy_rank,case definition->>'privacy' when 'restricted' then 2 when 'coarse' then 1 else 0 end);
  priority:=priority or coalesce((definition->>'priority')::boolean,false);
  allowed:=allowed||array(select jsonb_array_elements_text(definition->'questions'));
 end loop;
 for field_key,answer in select * from jsonb_each(answer_values) loop
  if not field_key=any(allowed) then raise exception 'Answer is unrelated to the selected observation';end if;
  select q.definition into field_def from observation_catalog_questions q where q.version=version_id and q.id=field_key;
  if field_def is null then raise exception 'Unknown answer field';end if;
  dependency:=field_def->'showWhen';
  if dependency is not null and not coalesce((dependency->'values') ? (answer_values->>(dependency->>'field')),false) then raise exception 'Hidden dependent answer is not allowed';end if;
  value_text:=answer_values->>field_key;
  if field_def->>'type'='choice' then
   if jsonb_typeof(answer)<>'string' or not exists(select 1 from jsonb_array_elements(field_def->'options') o where o->>'value'=value_text) then raise exception 'Choose a listed answer';end if;
  elsif field_def->>'type'='text' then
   if jsonb_typeof(answer)<>'string' or length(trim(value_text))=0 or length(value_text)>(field_def->>'maxLength')::integer then raise exception 'Invalid text answer';end if;
  elsif field_def->>'type'='number' then
   if jsonb_typeof(answer)<>'number' then raise exception 'Invalid numeric answer';end if;
   if value_text::numeric<trunc((field_def->>'min')::numeric) or value_text::numeric>(field_def->>'max')::numeric or trunc(value_text::numeric)<>value_text::numeric then raise exception 'Invalid numeric answer';end if;
  else raise exception 'Unsupported answer field';end if;
  if coalesce((field_def->'coarseValues') ? value_text,false) then privacy_rank:=greatest(privacy_rank,1);end if;
  if coalesce((field_def->'reviewValues') ? value_text,false) then privacy_rank:=2;end if;
  if coalesce((field_def->'priorityValues') ? value_text,false) then priority:=true;end if;
 end loop;
 return jsonb_build_object('privacy',case privacy_rank when 2 then 'restricted' when 1 then 'coarse' else 'approximate' end,'priority',case when priority then 'priority' else 'normal' end,'legacyCategory',type_def->>'legacyCategory','legacyKind',type_def->>'legacyKind');
end $$;
create function public.prepare_catalog_observation() returns trigger language plpgsql security definer set search_path=public as $$
declare path jsonb;policy jsonb;animal text;
begin
 if new.event_type_id is null or (tg_op='UPDATE' and new.details is distinct from old.details) then
  if new.kind is null then new.kind:=case new.category when 'Outdoors' then 'wildlife' when 'Travel' then 'road' else 'hazard' end;end if;
  if not ((new.category='Safety' and new.kind in ('hazard','smoke','flooding')) or (new.category='Outdoors' and new.kind in ('wildlife','trail','aurora')) or (new.category='Travel' and new.kind='road')) then raise exception 'Report type does not match category';end if;
  if jsonb_typeof(new.details)<>'object' or octet_length(new.details::text)>2000 or exists(select 1 from jsonb_object_keys(new.details) k where k not in ('animal','count','surface','visibility')) then raise exception 'Unsupported legacy details';end if;
  if (new.details ? 'animal' or new.details ? 'count') and new.kind<>'wildlife' then raise exception 'Animal details require wildlife';end if;
  if (new.details ? 'surface' or new.details ? 'visibility') and new.kind<>'road' then raise exception 'Road details require road type';end if;
  if new.details ? 'animal' and (jsonb_typeof(new.details->'animal')<>'string' or length(new.details->>'animal')>80) then raise exception 'Invalid animal';end if;
  if new.details ? 'surface' and new.details->>'surface' not in ('Unknown','Dry','Wet','Snow','Ice') then raise exception 'Invalid surface';end if;
  if new.details ? 'visibility' and new.details->>'visibility' not in ('Unknown','Good','Reduced','Very poor') then raise exception 'Invalid visibility';end if;
  new.answers:=legacy_observation_answers(new.kind,new.details);
 end if;
 if new.event_type_id is null then
  path:=legacy_observation_path(new.category,new.kind);
  new.domain_id:=path->>'domain';new.topic_id:=path->>'topic';new.event_type_id:=path->>'type';new.taxonomy_version:=1;
  new.answers:=legacy_observation_answers(new.kind,new.details);
 end if;
 policy:=catalog_policy(new.taxonomy_version,new.domain_id,new.topic_id,new.event_type_id,new.related_type_ids,new.answers);
 new.category:=policy->>'legacyCategory';new.kind:=policy->>'legacyKind';new.privacy_class:=policy->>'privacy';new.review_priority:=policy->>'priority';
 -- Project compatible old detail fields without losing the richer versioned answers.
 new.details:='{}';
 if new.kind='wildlife' then
  if new.answers ? 'animal' and new.answers->>'animal'<>'unknown' then
   if new.answers->>'animal'='other' then animal:=new.answers->>'other_animal';else select o->>'label' into animal from observation_catalog_questions q,jsonb_array_elements(q.definition->'options') o where q.version=new.taxonomy_version and q.id='animal' and o->>'value'=new.answers->>'animal';end if;
   if animal is not null then new.details:=new.details||jsonb_build_object('animal',animal);end if;
  end if;
  if new.answers ? 'count' then new.details:=new.details||jsonb_build_object('count',new.answers->'count');end if;
 end if;
 if new.kind='road' then
  if new.answers ? 'surface' then new.details:=new.details||jsonb_build_object('surface',case new.answers->>'surface' when 'black_ice' then 'Ice' when 'slush' then 'Snow' else initcap(new.answers->>'surface') end);end if;
  if new.answers ? 'visibility' then new.details:=new.details||jsonb_build_object('visibility',case new.answers->>'visibility' when 'very_poor' then 'Very poor' else initcap(new.answers->>'visibility') end);end if;
 end if;
 return new;
end $$;
create trigger aa_prepare_catalog before insert or update on observations for each row execute function public.prepare_catalog_observation();
create function public.enforce_observation_privacy() returns trigger language plpgsql security definer set search_path=public as $$
begin
 -- Privacy cannot be downgraded by reclassifying an existing sensitive report.
 if tg_op='UPDATE' then
  if old.privacy_class='restricted' then new.privacy_class:='restricted';elsif old.privacy_class='coarse' and new.privacy_class='approximate' then new.privacy_class:='coarse';end if;
 end if;
 if new.privacy_class='restricted' then
  new.latitude:=round(new.latitude::numeric);new.longitude:=round(new.longitude::numeric);new.place_name:='Regional information';
  if tg_op='INSERT' or not is_moderator() then new.status:='review';new.privacy_reviewed_at:=null;end if;
  if new.status='published' and new.privacy_reviewed_at is null then raise exception 'Private publication review is required';end if;
 elsif new.privacy_class='coarse' then
  new.latitude:=round(new.latitude::numeric,1);new.longitude:=round(new.longitude::numeric,1);new.place_name:='Generalized area';
 else
  new.latitude:=round(new.latitude::numeric,2);new.longitude:=round(new.longitude::numeric,2);
 end if;
 return new;
end $$;
create trigger zz_enforce_privacy before insert or update on observations for each row execute function public.enforce_observation_privacy();
grant select(taxonomy_version,domain_id,topic_id,event_type_id,related_type_ids,answers,privacy_class) on observations to anon,authenticated;
grant insert(taxonomy_version,domain_id,topic_id,event_type_id,related_type_ids,answers) on observations to authenticated;
grant update(taxonomy_version,domain_id,topic_id,event_type_id,related_type_ids,answers) on observations to authenticated;

create or replace function public.guard_observation() returns trigger language plpgsql security definer set search_path=public as $$
begin
 if tg_op='INSERT' then
   perform pg_advisory_xact_lock(hashtext(new.author_id::text));
   if (select count(*) from observations where author_id=new.author_id and created_at>now()-interval '1 hour') >= 5 then raise exception 'Limit of five observations per hour'; end if;
   new.status:='published';new.verification:='unverified';new.created_at:=now();
 elsif not is_moderator() then
   if old.status<>'published' or new.status<>old.status or new.verification<>old.verification or new.author_id<>old.author_id or new.created_at<>old.created_at or new.id<>old.id then raise exception 'Protected moderation fields';end if;
   new.verification:='unverified';
 end if;
 new.updated_at:=now();return new;
end $$;
create table public.observation_assessments(
 id bigint generated always as identity primary key,
 observation_id uuid not null references observations,
 assessed_by uuid references auth.users on delete set null,
 level text not null check(level in ('none','caution','hazard','urgent')),
 lifecycle text not null check(lifecycle in ('active','resolved','disputed')),
 reason text not null check(length(trim(reason)) between 5 and 2000),
 evidence_ref text check(length(evidence_ref)<=500),
 public_note text check(length(public_note)<=160),
 assessed_at timestamptz not null default clock_timestamp(),
 expires_at timestamptz
);
create index observation_assessments_latest on observation_assessments(observation_id,id desc);
alter table observation_assessments enable row level security;
create policy assessments_staff_read on observation_assessments for select to authenticated using(is_moderator());
create table public.observation_publication_reviews(
 id bigint generated always as identity primary key,
 observation_id uuid not null references observations,
 reviewed_by uuid references auth.users on delete set null,
 reason text not null,
 basis text not null check(basis in ('privacy_review','official_source','documented_consent')),
 reference text not null,
 before_content jsonb not null,
 reviewed_at timestamptz not null default clock_timestamp()
);
alter table observation_publication_reviews enable row level security;
create policy publication_staff_read on observation_publication_reviews for select to authenticated using(is_moderator());
create function public.set_observation_assessment(report uuid,risk_level text,state text,explanation text,evidence text,public_summary text,expiry timestamptz) returns void language plpgsql security definer set search_path=public as $$
begin
 if not is_moderator() then raise exception 'Staff authorization required';end if;
 perform 1 from observations where id=report for update;if not found then raise exception 'Observation not found';end if;
 if risk_level not in ('none','caution','hazard','urgent') or state not in ('active','resolved','disputed') or length(trim(explanation)) not between 5 and 2000 or length(coalesce(public_summary,''))>160 or length(coalesce(evidence,''))>500 then raise exception 'Invalid assessment';end if;
 if risk_level in ('hazard','urgent') and length(trim(coalesce(evidence,'')))<5 then raise exception 'A supporting reference is required';end if;
 if state='active' and risk_level<>'none' then
  if expiry is null or expiry<=now() or expiry>now()+interval '24 hours' then raise exception 'Active assessments require an expiry within 24 hours';end if;
  if risk_level='urgent' and expiry>now()+interval '6 hours' then raise exception 'Urgent assessments require review within 6 hours';end if;
 end if;
 insert into observation_assessments(observation_id,assessed_by,level,lifecycle,reason,evidence_ref,public_note,expires_at) values(report,auth.uid(),risk_level,state,trim(explanation),nullif(trim(evidence),''),nullif(trim(public_summary),''),expiry);
end $$;
revoke all on function public.set_observation_assessment(uuid,text,text,text,text,text,timestamptz) from public;
grant execute on function public.set_observation_assessment(uuid,text,text,text,text,text,timestamptz) to authenticated;
create function public.get_public_assessment(report uuid) returns table(assessment_level text,assessment_state text,assessed_at timestamptz,assessment_expires_at timestamptz,assessment_note text) language sql stable security definer set search_path=public as $$
 with latest as (
  select a.* from observation_assessments a join observations o on o.id=a.observation_id where a.observation_id=report and o.status='published' order by a.id desc limit 1
 )
 select case when a.lifecycle='active' and a.level<>'none' and a.expires_at>now() then a.level else 'none' end,
 case when a.id is null or (a.level='none' and a.lifecycle='active') then 'not_assessed' when a.lifecycle='resolved' then 'resolved' when a.lifecycle='disputed' then 'disputed' when a.expires_at is null or a.expires_at<=now() then 'expired' else 'active' end,
 a.assessed_at,a.expires_at,case when a.lifecycle='active' and a.expires_at>now() then a.public_note else null end
 from (select 1) one left join latest a on true
$$;
grant execute on function public.get_public_assessment(uuid) to anon,authenticated;
-- The view exposes only public-safe columns; author identity and evidence references never enter it.
create view public.observation_feed with (security_invoker=true) as
 select o.id,o.category,o.kind,o.title,o.description,o.latitude,o.longitude,o.place_name,o.observed_at,o.details,o.created_at,o.updated_at,o.verification,o.status,o.taxonomy_version,o.domain_id,o.topic_id,o.event_type_id,o.related_type_ids,o.answers,o.privacy_class,a.*
 from observations o cross join lateral get_public_assessment(o.id) a;
grant select on observation_feed to anon,authenticated;
create function public.my_observations() returns setof public.observation_feed language sql stable security definer set search_path=public as $$
 select f.* from observation_feed f where f.id in (select o.id from observations o where o.author_id=auth.uid()) order by f.created_at desc limit 300
$$;
revoke all on function public.my_observations() from public;
grant execute on function public.my_observations() to authenticated;
-- Legacy review entrypoint cannot publish a sensitive report without the dedicated privacy workflow.
create or replace function public.moderate_report(report uuid,decision text,explanation text) returns void language plpgsql security definer set search_path=public as $$
begin
 if not is_moderator() then raise exception 'Moderator required';end if;
 if decision not in ('approve','hide','review') or length(trim(explanation))<5 then raise exception 'Decision and reason required';end if;
 if decision='approve' and exists(select 1 from observations where id=report and privacy_class='restricted') then raise exception 'Use protected publication review for this report';end if;
 update observations set status=case decision when 'approve' then 'published' when 'hide' then 'hidden' else 'review' end,verification=case decision when 'approve' then 'reviewed' else 'unverified' end where id=report;
 if not found then raise exception 'Report not found';end if;
 insert into moderation_actions(observation_id,moderator_id,action,reason) values(report,auth.uid(),decision,explanation);
end $$;
create function public.review_observation(report uuid,decision text,review_status text,explanation text,privacy_checked boolean,publication_basis text,supporting_reference text,public_title text,public_description text) returns void language plpgsql security definer set search_path=public as $$
declare old_report observations%rowtype;needs_consent boolean;
begin
 if not is_moderator() then raise exception 'Staff authorization required';end if;
 select * into old_report from observations where id=report for update;if not found then raise exception 'Observation not found';end if;
 if decision not in ('approve','hide','review') or review_status not in ('unverified','reviewed') or length(trim(explanation)) not between 5 and 2000 then raise exception 'Invalid review';end if;
 if decision='approve' and old_report.privacy_class='restricted' then
  if privacy_checked is distinct from true or publication_basis not in ('privacy_review','official_source','documented_consent') or length(trim(coalesce(supporting_reference,''))) not between 10 and 500 then raise exception 'Privacy review and a supporting reference are required';end if;
  needs_consent:=old_report.topic_id='safety.restricted' or old_report.event_type_id in ('missing_person','vulnerable_person') or old_report.related_type_ids && array['missing_person','vulnerable_person'];
  if needs_consent and publication_basis not in ('official_source','documented_consent') then raise exception 'Missing/vulnerable-person publication requires an official source or documented consent';end if;
  if length(trim(coalesce(public_title,''))) not between 5 and 100 or length(trim(coalesce(public_description,''))) not between 10 and 2000 then raise exception 'A safe public title and description are required';end if;
  insert into observation_publication_reviews(observation_id,reviewed_by,reason,basis,reference,before_content) values(report,auth.uid(),explanation,publication_basis,supporting_reference,jsonb_build_object('title',old_report.title,'description',old_report.description,'answers',old_report.answers));
 end if;
 update observations set status=case decision when 'approve' then 'published' when 'hide' then 'hidden' else 'review' end,
 verification=review_status,
 title=case when decision='approve' and old_report.privacy_class='restricted' then trim(public_title) else title end,
 description=case when decision='approve' and old_report.privacy_class='restricted' then trim(public_description) else description end,
 answers=case when decision='approve' and old_report.privacy_class='restricted' then (select coalesce(jsonb_object_agg(e.key,e.value),'{}'::jsonb) from jsonb_each(answers) e join observation_catalog_questions q on q.version=old_report.taxonomy_version and q.id=e.key where q.definition->>'type'<>'text') else answers end,
 privacy_reviewed_at=case when decision='approve' and old_report.privacy_class='restricted' then clock_timestamp() else privacy_reviewed_at end
 where id=report;
 insert into moderation_actions(observation_id,moderator_id,action,reason) values(report,auth.uid(),decision,explanation);
end $$;
revoke all on function public.review_observation(uuid,text,text,text,boolean,text,text,text,text) from public;
grant execute on function public.review_observation(uuid,text,text,text,boolean,text,text,text,text) to authenticated;
create function public.staff_review_queue() returns table(report jsonb,review_priority text) language plpgsql stable security definer set search_path=public as $$
begin
 if not is_moderator() then raise exception 'Staff authorization required';end if;
 return query select to_jsonb(f),o.review_priority from observation_feed f join observations o on o.id=f.id order by case o.review_priority when 'priority' then 0 else 1 end,o.created_at desc limit 100;
end $$;
revoke all on function public.staff_review_queue() from public;
grant execute on function public.staff_review_queue() to authenticated;
drop function public.observations_in_bounds(double precision,double precision,double precision,double precision);
create function public.observations_in_bounds(west double precision,south double precision,east double precision,north double precision) returns setof public.observation_feed language plpgsql stable security definer set search_path=public as $$
begin
 if west is null or east is null or north is null or south is null or west not between -180 and 180 or east not between -180 and 180 or south not between -90 and 90 or north not between -90 and 90 or south>north then raise exception 'Invalid map bounds';end if;
 if west<=east and east-west<180 and west<east and south<north then
  return query select f.* from observation_feed f join observations o on o.id=f.id where o.status='published' and o.privacy_class<>'restricted' and o.longitude between west and east and o.latitude between south and north and o.location OPERATOR(extensions.&&) (extensions.st_makeenvelope(west,south,east,north,4326)::extensions.geography) order by o.observed_at desc limit 300;
 else
  return query select f.* from observation_feed f where f.status='published' and f.privacy_class<>'restricted' and f.latitude between south and north and ((west<=east and f.longitude between west and east) or (west>east and (f.longitude>=west or f.longitude<=east))) order by f.observed_at desc limit 300;
 end if;
end $$;
grant execute on function public.observations_in_bounds(double precision,double precision,double precision,double precision) to anon,authenticated;
