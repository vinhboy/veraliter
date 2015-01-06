#!/usr/bin/env python
# Use nmap to scan for open port 3480
# This is the port LuaUPnP listens on
# Return a json array of servers {ip,model}

import cgi
import urllib2
import nmap
import json

MiCasaVerdes = []
form = cgi.FieldStorage()
subnet = form.getvalue('subnet') or '192.168.1.0/24'

nm = nmap.PortScanner()
servers = nm.scan(subnet, arguments='--open -p 3480')
for server in servers['scan'].keys():
    url = 'http://'+server+':3480/data_request?id=user_data&output_format=json'
    response = urllib2.urlopen(url)
    data = json.load(response)
    # If the server respond with a model string on port 3480, then we've got a live device.
    if data['model']:
        MiCasaVerdes.append({'ip':server,'model':data['model']})

print "Content-type: text/json"
print
print json.dumps(MiCasaVerdes)
