@echo off
if not exist "data\db" mkdir "data\db"
echo Starting MongoDB...
mongod --dbpath data\db