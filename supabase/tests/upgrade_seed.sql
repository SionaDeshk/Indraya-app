insert into auth.users values('00000000-0000-0000-0000-000000000001');
alter table observations disable trigger guard_observation;
insert into observations(id,author_id,category,title,description,latitude,longitude,status,verification,created_at,updated_at) values
('11111111-1111-1111-1111-111111111111','00000000-0000-0000-0000-000000000001','Outdoors','Legacy published fixture','FICTIONAL upgrade preservation fixture.',61.22,-149.90,'published','reviewed','2025-01-01','2025-02-01'),
('22222222-2222-2222-2222-222222222222','00000000-0000-0000-0000-000000000001','Travel','Legacy hidden fixture','FICTIONAL upgrade preservation fixture.',61.22,-149.90,'hidden','unverified','2025-01-01','2025-02-01'),
('33333333-3333-3333-3333-333333333333','00000000-0000-0000-0000-000000000001','Safety','Legacy held fixture','FICTIONAL upgrade preservation fixture.',61.22,-149.90,'review','unverified','2025-01-01','2025-02-01');
alter table observations enable trigger guard_observation;
