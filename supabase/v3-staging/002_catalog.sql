-- STAGING ONLY; apply after 001. Prices match the preserved 40-item catalog.
begin;
do $target$ begin
 if not (select count(*)=1 and coalesce(bool_and(name='jaxon-maths-v3-staging' and project_ref ~ '^[a-z]{20}$' and project_ref not in ('sfogrvedypgtxfvecmbx','mbdelspbjusarbwlltol')),false) from public.v3_environment)
 then raise exception 'New isolated staging marker required; Main and deleted project forbidden'; end if;
end $target$;

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
