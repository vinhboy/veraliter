#!/usr/bin/env python

import cgi
import urllib2

form = cgi.FieldStorage()

response = urllib2.urlopen(form.getvalue('url'))

print "Content-type: text/json"
print
print response.read()
