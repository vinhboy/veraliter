#!/usr/bin/env python

import cgi
import urllib2
import socket
import nmap
import json
import random

def is_valid_ipv4_address(addr):
    try:
        socket.inet_aton(addr)
        return True
    except socket.error:
        return False
    return False
    
form = cgi.FieldStorage()
if form.getvalue('ip'):
    if is_valid_ipv4_address(form.getvalue('ip')):
        url = 'http://'+form.getvalue('ip')+':3480/data_request?'
        if form.getvalue('DeviceNum'):
            DeviceNum = form.getvalue('DeviceNum')
            if form.getvalue('NewCurrentSetpoint'):
               response = 'ok'
               url += 'id=lu_action&output_format=json&serviceId=urn:upnp-org:serviceId:TemperatureSetpoint1&action=SetCurrentSetpoint&DeviceNum='+DeviceNum+'&NewCurrentSetpoint='+form.getvalue('NewCurrentSetpoint')
            elif form.getvalue('NewModeTarget'):
               url += 'id=lu_action&output_format=json&action=SetModeTarget&serviceId=urn:upnp-org:serviceId:HVAC_UserOperatingMode1&rand='+`random.random()`+'&DeviceNum='+DeviceNum+'&NewModeTarget='+form.getvalue('NewModeTarget')
        else:
            url += 'id=user_data&output_format=json'
        response = urllib2.urlopen(url)
        response = response.read()
else:
    # We use nmap to scan for open port 3480. This is the port MiCasa responds to with data
    # We return an array of servers {ip,model}
    MiCasaVerdes = []
    nm = nmap.PortScanner()
    servers = nm.scan('192.168.1.0/24', arguments='--open -p 3480')
    for server in servers['scan'].keys():
        url = 'http://'+server+':3480/data_request?id=user_data&output_format=json'
        response = urllib2.urlopen(url)
        data = json.load(response)
        # If the server respond with a model number on port 3480, then we've got a live device.
        if data['model']:
            MiCasaVerdes.append({'ip':server,'model':data['model']})
    response = json.dumps(MiCasaVerdes)

print "Content-type: text/json"
print
print response
