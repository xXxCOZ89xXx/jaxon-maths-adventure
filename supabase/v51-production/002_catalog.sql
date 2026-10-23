-- PRODUCTION DRAFT: same original 40-item catalogue; no legacy wallet authority.
-- Apply only to the reviewed inactive production backend after 001.
begin;
do $$ begin
 if current_user<>'postgres' or current_setting('app.v51.migration_authorized',true) is distinct from 'yes'
 or not exists(select 1 from public.v3_environment where name='jaxon-maths-production' and project_ref='mbdelspbjusarbwlltol' and contract_version=1 and not ready)
 then raise exception 'Reviewed inactive production backend required'; end if;
end $$;
insert into public.v3_catalog(item_id,cost) values
('helmet',100),
('cap',45),
('crown',450),
('wizardhat',240),
('hardhat',110),
('headphones',160),
('tophat',180),
('jacket',150),
('hoodie',90),
('armour',420),
('suit',220),
('cape',300),
('spacesuit',520),
('ninja',330),
('wings',250),
('jetpack',550),
('rucksack',100),
('shield',230),
('parachute',210),
('dragon',650),
('glasses',70),
('medal',120),
('watch',100),
('scarf',85),
('gloves',75),
('sword',190),
('wand',210),
('fox',320),
('dog',280),
('cat',230),
('frog',180),
('robot',450),
('axolotl',380),
('bee',160),
('forestbg',140),
('desertbg',160),
('spacebg',310),
('castlebg',230),
('mountainbg',240),
('neonbg',350);
commit;
