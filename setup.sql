CREATE database StackAe;
use StackAe;
create table tables (
	name VARCHAR(255),
    rawname varchar(255),
    creator VARCHAR(255),
    id INT(16),
    url varchar(255)
);
CREATE TABLE accounts (
    Id varchar(255),
    toke varchar(255),
    Username varchar(255),
    Password varchar(255),
    creationDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    lastUpdated DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    Email varchar(255),
    verify boolean not null default false
);