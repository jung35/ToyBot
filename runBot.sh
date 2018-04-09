#!/bin/bash

PID_FILE=/tmp/toybot.pid

[ -f $PID_FILE ] && kill -9 $(cat $PID_FILE) && rm $PID_FILE

echo "Starting ToyBot"
node src/index.js > ~/log/ToyLog.log 2>&1 & echo $! >>$PID_FILE

