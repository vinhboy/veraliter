$myapp = angular.module("myapp", ['ui.bootstrap','ngCookies'])
$myapp.controller("MyController", function($scope, $http, $interval, $cookieStore) {
  $scope.device_type = {
    '5': {
      "name":"Thermostat",
      "slug":"thermostat"
    },
    '7': {
      "name":"Door Lock",
      "slug":"door_lock"
    }
  };
  $scope.refresh = function() {
    if (!$scope.selectedMiCasaVerde) {
      var cookies = $cookieStore.get('MiCasaVerdes');
      if (cookies) {
        $scope.setMiCasaVerde(cookies);
      } else {
        $scope.getMiCasaVerdes();
      }
    } else {
      var url = $scope.generateURL('data_request?id=user_data&output_format=json')
      var responsePromise = $http.get(url);
      
      responsePromise.success(function(data, status, headers, config) {
        $scope.devices = [];
        angular.forEach(data.devices,function(device,key){
          if (device.onDashboard) {
            device.DeviceStateObj = {};
            angular.forEach(device.states, function(state, key) {
              device.DeviceStateObj[state.variable] = state.value;
            });
            $scope.devices.push(device);
          }
        });
        console.log('refreshed');
        $scope.startRefresh();
      });
      responsePromise.error(function(data, status, headers, config) {
        $scope.stopRefresh();
        alert("refresh failed!");
      });
    }
  };
  
  $scope.startRefresh = function() {
    if ( angular.isDefined($scope.refreshTimer) ) return;
    $scope.refreshTimer = $interval(function(){
      $scope.refresh();
    },10000);
  };
  $scope.stopRefresh = function() {
    if (angular.isDefined($scope.refreshTimer)) {
      $interval.cancel($scope.refreshTimer);
      $scope.refreshTimer = undefined;
    }
  };
  
  $scope.getMiCasaVerdes = function() {
    console.log('getMiCasaVerdes');
    var responsePromise = $http.get('/cgi-bin/find_devices.py');
    
    responsePromise.success(function(data, status, headers, config) {
      $scope.setMiCasaVerde(data);
      $cookieStore.put('MiCasaVerdes',data);
    });
    responsePromise.error(function(data, status, headers, config) {
      alert("getMiCasaVerdes failed!");
    });
  };
  $scope.setMiCasaVerde = function(data){
    console.log('setMiCasaVerde');
    $scope.MiCasaVerdes = data;
    $scope.selectedMiCasaVerde = data[0];
    $scope.base_url = 'http://'+$scope.selectedMiCasaVerde['ip']+':3480/'
    $scope.refresh();
  }
  $scope.getDeviceTypeSlug = function(category_num){
    return $scope.device_type[category_num].slug;
  }
  $scope.getDeviceTypeName = function(category_num) {
    return $scope.device_type[category_num].name;
  };
  $scope.generateURL = function(queryString){
    var proxy = '/cgi-bin/get.py?url='
    var url = encodeURIComponent($scope.base_url+queryString);
    return proxy + url;
  }
  
  $scope.refresh();
});
$myapp.controller("thermostatCtrl", function($scope, $http, $timeout) {
  $scope.sliderValue = $scope.device.DeviceStateObj.CurrentSetpoint * 1;
  $scope.modeStatus = $scope.device.DeviceStateObj.ModeStatus;
  $scope.DeviceNum = $scope.device.id;
  
  $scope.decreaseTemp = function(){
    $scope.sliderValue--;
  }
  $scope.increaseTemp = function(){
    $scope.sliderValue++;
  }
  
  $scope.$watch('sliderValue',function(newValue,oldValue){
    if(isNaN(oldValue) || isNaN($scope.sliderValue) || newValue == oldValue) return;
    $timeout.cancel($scope.settingCurrentSetpoint);
    $scope.settingCurrentSetpoint = $timeout(function(){$scope.setCurrentSetpoint($scope.sliderValue)}, 2000);
  });
  $scope.setCurrentSetpoint = function(NewCurrentSetpoint){
    $scope.stopRefresh();
    var url = $scope.generateURL('data_request?id=lu_action&output_format=json&serviceId=urn:upnp-org:serviceId:TemperatureSetpoint1&action=SetCurrentSetpoint&DeviceNum='+$scope.DeviceNum+'&NewCurrentSetpoint='+NewCurrentSetpoint);
    var responsePromise = $http.get(url);
    
    responsePromise.success(function(data, status, headers, config) {
      console.log('setCurrentSetpoint success');
    });
    responsePromise.error(function(data, status, headers, config) {
      alert("setCurrentSetpoint failed!");
    });
    $scope.startRefresh();
  };
  
  $scope.$watch('modeStatus',function(newValue,oldValue){
    if (newValue == oldValue || (typeof oldValue === 'undefined')) return;
    $scope.setModeTarget($scope.modeStatus);
  });
  $scope.setModeTarget = function(NewModeTarget){
    $scope.stopRefresh();
    var url = $scope.generateURL('data_request?id=lu_action&output_format=json&action=SetModeTarget&serviceId=urn:upnp-org:serviceId:HVAC_UserOperatingMode1&rand='+Math.random()+'&DeviceNum='+$scope.DeviceNum+'&NewModeTarget='+NewModeTarget);
    var responsePromise = $http.get(url);
    
    responsePromise.success(function(data, status, headers, config) {
      console.log('setModeTarget success');
    });
    responsePromise.error(function(data, status, headers, config) {
      alert("setModeTarget failed!");
    });
    $scope.startRefresh();
  }
});
