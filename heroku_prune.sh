#!/bin/bash

echo " ****************** Begin prune ****************** "
node prune.js
echo " ****************** End prune   ****************** "

echo " ****************** Begin heroku repo update ****************** "
git commit -a -m "prune update"
git push
git push heroku master
echo " ****************** End heroku repo update ****************** "
