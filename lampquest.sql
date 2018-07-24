-- phpMyAdmin SQL Dump
-- version 3.2.4
-- http://www.phpmyadmin.net
--
-- Host: localhost
-- Generation Time: Jul 12, 2018 at 10:15 PM
-- Server version: 5.1.41
-- PHP Version: 5.3.1

SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;

--
-- Database: `lampquest`
--

-- --------------------------------------------------------

--
-- Table structure for table `combiner`
--

CREATE TABLE IF NOT EXISTS `combiner` (
  `combiner_id` int(11) NOT NULL,
  `produce_item_id` int(11) NOT NULL,
  `energy_required` int(11) NOT NULL,
  `qty_produced` int(11) NOT NULL DEFAULT '1',
  PRIMARY KEY (`combiner_id`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

--
-- Dumping data for table `combiner`
--

INSERT INTO `combiner` (`combiner_id`, `produce_item_id`, `energy_required`, `qty_produced`) VALUES
(1, 3, 2, 1);

-- --------------------------------------------------------

--
-- Table structure for table `consume_combiner`
--

CREATE TABLE IF NOT EXISTS `consume_combiner` (
  `combiner_id` int(11) NOT NULL,
  `consume_item_id` int(11) NOT NULL,
  `qty_consumed` int(11) NOT NULL,
  PRIMARY KEY (`combiner_id`,`consume_item_id`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

--
-- Dumping data for table `consume_combiner`
--

INSERT INTO `consume_combiner` (`combiner_id`, `consume_item_id`, `qty_consumed`) VALUES
(1, 1, 2),
(1, 2, 1);

-- --------------------------------------------------------

--
-- Table structure for table `diffusor`
--

CREATE TABLE IF NOT EXISTS `diffusor` (
  `diffusor_id` int(11) NOT NULL,
  `consume_item_id` int(11) NOT NULL,
  `energy_released` int(11) NOT NULL,
  `energy_limit` int(11) NOT NULL,
  `qty_consumed` int(11) NOT NULL DEFAULT '1',
  PRIMARY KEY (`diffusor_id`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

--
-- Dumping data for table `diffusor`
--

INSERT INTO `diffusor` (`diffusor_id`, `consume_item_id`, `energy_released`, `energy_limit`, `qty_consumed`) VALUES
(2, 3, 1, 100, 1),
(3, 4, 20, 500, 1),
(4, 6, 5, 500, 1);

-- --------------------------------------------------------

--
-- Table structure for table `item`
--

CREATE TABLE IF NOT EXISTS `item` (
  `item_id` int(11) NOT NULL AUTO_INCREMENT,
  `item_name` varchar(255) NOT NULL,
  `item_image` varchar(255) NOT NULL,
  PRIMARY KEY (`item_id`)
) ENGINE=MyISAM  DEFAULT CHARSET=latin1 AUTO_INCREMENT=8 ;

--
-- Dumping data for table `item`
--

INSERT INTO `item` (`item_id`, `item_name`, `item_image`) VALUES
(1, 'Hydrogen', 'hydrogen.jpg'),
(2, 'Oxygen', 'oxygen.jpg'),
(3, 'Water', 'water.jpg'),
(4, 'Sulphur Dioxide', 'so2.jpg'),
(5, 'Sulphur', 'sulphur.jpg'),
(6, 'Methane', 'methane.jpg'),
(7, 'Carbon', 'carbon.jpg');

-- --------------------------------------------------------

--
-- Table structure for table `item_robot`
--

CREATE TABLE IF NOT EXISTS `item_robot` (
  `item_id` int(11) NOT NULL,
  `robot_id` int(11) NOT NULL,
  `build_start_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `build_end_time` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`item_id`,`robot_id`,`build_start_time`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

--
-- Dumping data for table `item_robot`
--


-- --------------------------------------------------------

--
-- Table structure for table `planet`
--

CREATE TABLE IF NOT EXISTS `planet` (
  `planet_id` int(11) NOT NULL AUTO_INCREMENT,
  `planet_name` varchar(255) NOT NULL,
  `planet_image` varchar(255) NOT NULL,
  `difficulty_level` int(11) NOT NULL,
  `initial_energy` int(11) NOT NULL,
  PRIMARY KEY (`planet_id`)
) ENGINE=MyISAM  DEFAULT CHARSET=latin1 AUTO_INCREMENT=5 ;

--
-- Dumping data for table `planet`
--

INSERT INTO `planet` (`planet_id`, `planet_name`, `planet_image`, `difficulty_level`, `initial_energy`) VALUES
(1, 'Dagobah', 'dagobah.jpg', 1, 100),
(2, 'Tatooine', 'tatooine.jpg', 2, 240),
(3, 'Hoth', 'hoth.jpg', 3, 100),
(4, 'Mustafar', 'mustafar.jpg', 4, 300);

-- --------------------------------------------------------

--
-- Table structure for table `planet_item_goal`
--

CREATE TABLE IF NOT EXISTS `planet_item_goal` (
  `planet_id` int(11) NOT NULL,
  `item_id` int(11) NOT NULL,
  `required_qty` int(11) NOT NULL,
  PRIMARY KEY (`planet_id`,`item_id`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

--
-- Dumping data for table `planet_item_goal`
--

INSERT INTO `planet_item_goal` (`planet_id`, `item_id`, `required_qty`) VALUES
(2, 3, 100),
(1, 2, 100),
(4, 3, 100),
(4, 2, 100),
(3, 3, 100);

-- --------------------------------------------------------

--
-- Table structure for table `planet_item_init_resource`
--

CREATE TABLE IF NOT EXISTS `planet_item_init_resource` (
  `planet_id` int(11) NOT NULL,
  `item_id` int(11) NOT NULL,
  `available_qty` int(11) NOT NULL,
  PRIMARY KEY (`planet_id`,`item_id`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

--
-- Dumping data for table `planet_item_init_resource`
--

INSERT INTO `planet_item_init_resource` (`planet_id`, `item_id`, `available_qty`) VALUES
(2, 1, 200),
(2, 2, 100),
(1, 3, 100),
(4, 1, 200),
(4, 4, 100),
(3, 2, 100),
(3, 6, 50);

-- --------------------------------------------------------

--
-- Table structure for table `planet_user`
--

CREATE TABLE IF NOT EXISTS `planet_user` (
  `planet_user_id` int(11) NOT NULL AUTO_INCREMENT,
  `planet_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `energy` int(11) NOT NULL,
  `completed` tinyint(1) NOT NULL,
  PRIMARY KEY (`planet_user_id`),
  UNIQUE KEY `planet_id` (`planet_id`,`user_id`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

--
-- Dumping data for table `planet_user`
--


-- --------------------------------------------------------

--
-- Table structure for table `planet_user_item`
--

CREATE TABLE IF NOT EXISTS `planet_user_item` (
  `planet_user_id` int(11) NOT NULL,
  `item_id` int(11) NOT NULL,
  `owned_qty` int(11) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

--
-- Dumping data for table `planet_user_item`
--


-- --------------------------------------------------------

--
-- Table structure for table `produce_diffusor`
--

CREATE TABLE IF NOT EXISTS `produce_diffusor` (
  `diffusor_id` int(11) NOT NULL,
  `produce_item_id` int(11) NOT NULL,
  `qty_produced` int(11) NOT NULL,
  PRIMARY KEY (`diffusor_id`,`produce_item_id`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

--
-- Dumping data for table `produce_diffusor`
--

INSERT INTO `produce_diffusor` (`diffusor_id`, `produce_item_id`, `qty_produced`) VALUES
(2, 1, 2),
(2, 2, 1),
(3, 5, 1),
(3, 2, 2),
(4, 7, 1),
(4, 1, 4);

-- --------------------------------------------------------

--
-- Table structure for table `robot`
--

CREATE TABLE IF NOT EXISTS `robot` (
  `robot_id` int(11) NOT NULL AUTO_INCREMENT,
  `robot_name` varchar(255) NOT NULL,
  `planet_user_id` int(11) NOT NULL,
  `robot_type_id` int(11) NOT NULL,
  `enabled` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`robot_id`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

--
-- Dumping data for table `robot`
--


-- --------------------------------------------------------

--
-- Table structure for table `robot_type`
--

CREATE TABLE IF NOT EXISTS `robot_type` (
  `robot_type_id` int(11) NOT NULL AUTO_INCREMENT,
  `robot_type_name` varchar(255) NOT NULL,
  `time_required` int(11) NOT NULL,
  `robot_type_image` varchar(255) NOT NULL DEFAULT 'default.jpg',
  `initial_energy_cost` int(11) NOT NULL DEFAULT '10',
  PRIMARY KEY (`robot_type_id`)
) ENGINE=MyISAM  DEFAULT CHARSET=latin1 AUTO_INCREMENT=5 ;

--
-- Dumping data for table `robot_type`
--

INSERT INTO `robot_type` (`robot_type_id`, `robot_type_name`, `time_required`, `robot_type_image`, `initial_energy_cost`) VALUES
(1, 'Water generator', 60, 'default.jpg', 10),
(2, 'Hydrolyser', 60, 'bb8.jpg', 20),
(3, 'Sulphur Generator', 90, 'bb9e.jpg', 100),
(4, 'Methane Combustor', 90, 'r2q5.jpg', 25);

-- --------------------------------------------------------

--
-- Table structure for table `user`
--

CREATE TABLE IF NOT EXISTS `user` (
  `user_id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `experience` int(11) NOT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

--
-- Dumping data for table `user`
--


/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
