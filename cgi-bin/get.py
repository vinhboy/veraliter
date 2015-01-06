#!/usr/bin/env python

import cgi
import urllib2
import nmap
import json

response = ''
form = cgi.FieldStorage()

try:
    response = urllib2.urlopen(form.getvalue('url'))
    response = response.read()
    print "Content-type: text/json"
    print
    print response
except urllib2.URLError:
    print "Status: 404 Not Found\r\n"
    print "Content-type: text/json"
