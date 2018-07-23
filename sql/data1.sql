INSERT INTO planet (planet_name, planet_image, difficulty_level, initial_energy) 
VALUES ('Jakku', 'jakku.jpg', 5, 125);

INSERT INTO item (item_name, item_image) 
VALUES ('Carbon Dioxide', 'co2.jpg');




INSERT INTO planet_item_goal (planet_id, item_id, required_qty)
SELECT p.planet_id, i.item_id, 50
FROM planet p, item i
WHERE p.planet_name = 'Jakku' AND i.item_name = 'Water'
UNION 
SELECT p.planet_id, i.item_id, 25
FROM planet p, item i
WHERE p.planet_name = 'Jakku' AND i.item_name = 'Carbon Dioxide';


INSERT INTO planet_item_init_resource (planet_id, item_id, available_qty) 
SELECT p.planet_id, i.item_id, 25
FROM planet p, item i
WHERE p.planet_name = 'Jakku' AND i.item_name = 'Methane'
UNION 
SELECT p.planet_id, i.item_id, 50
FROM planet p, item i
WHERE p.planet_name = 'Jakku' AND i.item_name = 'Sulphur Dioxide';

INSERT INTO robot_type (robot_type_name, time_required, robot_type_image, initial_energy_cost)
VALUES ('Carbon Combustor', 120, 'r2d2.jpg', 100);


INSERT INTO combiner (combiner_id, produce_item_id, energy_required)
SELECT rt.robot_type_id, i.item_id, 25
FROM robot_type rt, item i
WHERE rt.robot_type_name = 'Carbon Combustor' AND i.item_name = 'Carbon Dioxide';

INSERT INTO consume_combiner (combiner_id, consume_item_id, qty_consumed)
SELECT rt.robot_type_id, i.item_id, i.qty 
FROM robot_type rt, (
    SELECT item_id, 1 qty
    FROM item
    WHERE item_name = 'Carbon'
    UNION
    SELECT item_id, 2 qty
    FROM item
    WHERE item_name = 'Oxygen'
) i
WHERE rt.robot_type_name = 'Carbon Combustor';

INSERT INTO Diffusor (diffusor_id, consume_item_id, energy_released, energy_limit)
SELECT rt.robot_type_id, i.item_id, 20, 500
FROM robot_type rt, item i
WHERE rt.robot_type_name = 'Sulphur Generator' AND i.item_name = 'Sulphur Dioxide'
UNION
SELECT rt.robot_type_id, i.item_id, 5, 500
FROM robot_type rt, item i
WHERE rt.robot_type_name = 'Methane Combustor' AND i.item_name = 'Methane';

INSERT INTO produce_diffusor (diffusor_id, produce_item_id, qty_produced)
SELECT rt.robot_type_id, i.item_id, i.qty 
FROM robot_type rt, (
    SELECT item_id, 1 qty
    FROM item
    WHERE item_name = 'Sulphur'
    UNION
    SELECT item_id, 2 qty
    FROM item
    WHERE item_name = 'Oxygen'
) i
WHERE rt.robot_type_name = 'Sulphur Generator'
UNION 
SELECT rt.robot_type_id, i.item_id, i.qty 
FROM robot_type rt, (
    SELECT item_id, 1 qty
    FROM item
    WHERE item_name = 'Carbon'
    UNION
    SELECT item_id, 4 qty
    FROM item
    WHERE item_name = 'Hydrogen'
) i
WHERE rt.robot_type_name = 'Methane Combustor';




