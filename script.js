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
  $scope.base_url = "/cgi-bin/get.py";
  
  $scope.refresh = function() {
    if (!$scope.selectedMiCasaVerde) {
      var cookies = $cookieStore.get('MiCasaVerdes');
      if (cookies) {
        $scope.setMiCasaVerde(cookies);
      } else {
        $scope.getMiCasaVerdes();
      }
    } else {
      var responsePromise = $http.get($scope.url);
      
      responsePromise.success(function(data, status, headers, config) {
        $scope.devices = [];
        angular.forEach(data.devices,function(device,key){
          if (device.onDashboard) {
            device.DeviceStateObj = $scope.createDeviceStateObj(device.states);
            $scope.devices.push(device);
          }
        });
        console.log('refreshed');
        $scope.startRefresh();
      });
      responsePromise.error(function(data, status, headers, config) {
        $scope.stopRefresh();
        alert("Something went wrong!");
      });
    }
  };
  
  var timer;
  $scope.startRefresh = function() {
    if ( angular.isDefined(timer) ) return;
    timer = $interval(function(){
      $scope.refresh();
    },10000);
  };
  $scope.stopRefresh = function() {
    if (angular.isDefined(timer)) {
      $interval.cancel(timer);
      timer = undefined;
    }
  };
  
  $scope.getMiCasaVerdes = function() {
    console.log('getMiCasaVerdes');
    var responsePromise = $http.get($scope.base_url);
    
    responsePromise.success(function(data, status, headers, config) {
      $scope.setMiCasaVerde(data);
      $cookieStore.put('MiCasaVerdes',data);
    });
    responsePromise.error(function(data, status, headers, config) {
      alert("Something went wrong!");
    });
  };
  $scope.setMiCasaVerde = function(data){
    console.log('setMiCasaVerde');
    $scope.MiCasaVerdes = data;
    $scope.selectedMiCasaVerde = data[0];
    $scope.url = $scope.base_url+"?ip="+$scope.selectedMiCasaVerde['ip'];
    $scope.refresh();
  }

  $scope.refresh();
  
  $scope.filterDevices = function(device){
    return device.onDashboard;
  }
  $scope.getDeviceTypeSlug = function(category_num){
    return $scope.device_type[category_num].slug;
  }
  $scope.getDeviceTypeName = function(category_num) {
    return $scope.device_type[category_num].name;
  };
  $scope.createDeviceStateObj = function(states){
    var values = {};
    angular.forEach(states, function(state, key) {
      values[state.variable] = state.value;
    });
    return values;
  }
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
    var url = $scope.url + '&DeviceNum=' + $scope.DeviceNum + '&NewCurrentSetpoint=' + NewCurrentSetpoint
    var responsePromise = $http.get(url);
    
    responsePromise.success(function(data, status, headers, config) {
      console.log('setCurrentSetpoint success');
    });
    responsePromise.error(function(data, status, headers, config) {
      alert("Something went wrong!");
    });
    $scope.startRefresh();
  };
  
  $scope.$watch('modeStatus',function(newValue,oldValue){
    if (newValue == oldValue || (typeof oldValue === 'undefined')) return;
    $scope.setModeTarget($scope.modeStatus);
  });
  $scope.setModeTarget = function(NewModeTarget){
    $scope.stopRefresh();
    var url = $scope.url + '&DeviceNum=' + $scope.DeviceNum + '&NewModeTarget=' + NewModeTarget;
    var responsePromise = $http.get(url);
    responsePromise.success(function(data, status, headers, config) {
      console.log('setModeTarget success');
    });
    responsePromise.error(function(data, status, headers, config) {
      alert("Something went wrong!");
    });
    $scope.startRefresh();
  }
});
