INSERT INTO planet_item_goal (planet_id, item_id, required_qty, initial_energy)
SELECT p.planet_id, i.item_id, 100, 1000
FROM planet p, item i
WHERE p.planet_name = 'Tatooine' AND i.item_name = 'Water'
UNION 
SELECT p.planet_id, i.item_id, 100, 1000
FROM planet p, item i
WHERE p.planet_name = 'Dagobah' AND i.item_name = 'Oxygen';



INSERT INTO planet_item_init_resource (planet_id, item_id, available_qty) 
SELECT p.planet_id, i.item_id, 100
FROM planet p, item i
WHERE p.planet_name = 'Tatooine' AND i.item_name IN ('Iron', 'Oxygen', 'Hydrogen')
UNION 
SELECT p.planet_id, i.item_id, 100
FROM planet p, item i
WHERE p.planet_name = 'Dagobah' AND i.item_name = 'Water';

INSERT INTO Combiner (combiner_id, produce_item_id, energy_required)
SELECT rt.robot_type_id, i.item_id, 20
FROM robot_type rt, item i
WHERE rt.robot_type_name = 'Water generator' AND i.item_name = 'Water';

INSERT INTO consume_combiner (combiner_id, consume_item_id, qty_consumed)
SELECT rt.robot_type_id, i.item_id, i.qty 
FROM robot_type rt, (
    SELECT item_id, 2 qty
    FROM item
    WHERE item_name = 'Hydrogen'
    UNION
    SELECT item_id, 1 qty
    FROM item
    WHERE item_name = 'Oxygen'
) i
WHERE rt.robot_type_name = 'Water generator';


INSERT INTO Diffusor (diffusor_id, consume_item_id, energy_released, energy_limit)
SELECT rt.robot_type_id, i.item_id, 10, 1000
FROM robot_type rt, item i
WHERE rt.robot_type_name = 'Hydrolyser' AND i.item_name = 'Water';

INSERT INTO produce_diffusor (diffusor_id, produce_item_id, qty_produced)
SELECT rt.robot_type_id, i.item_id, i.qty 
FROM robot_type rt, (
    SELECT item_id, 2 qty
    FROM item
    WHERE item_name = 'Hydrogen'
    UNION
    SELECT item_id, 1 qty
    FROM item
    WHERE item_name = 'Oxygen'
) i
WHERE rt.robot_type_name = 'Hydrolyser';




