angular.module("myapp", ['ui.bootstrap','ui.bootstrap-slider']).controller("MyController", function($scope, $http, $interval, $timeout) {
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
  $scope.myData = {
    sliderValue: 1
  };
  
  var timer;
  $scope.startRefresh = function() {
    if ( angular.isDefined(timer) ) return;
    timer = $interval(function(){
      $scope.myData.init();
    },10000);
  };
  $scope.stopRefresh = function() {
    if (angular.isDefined(timer)) {
      $interval.cancel(timer);
      timer = undefined;
    }
  };
  
  $scope.myData.init = function() {
    var url = encodeURIComponent('http://192.168.1.72:3480/data_request?id=user_data&output_format=json');
    var responsePromise = $http.get("/get.php?url="+url);
    
    responsePromise.success(function(data, status, headers, config) {
      $scope.myData.fromServer = data;
      console.log(data);
    });
    responsePromise.error(function(data, status, headers, config) {
      alert("AJAX failed!");
    });
  };
  $scope.myData.init();
  $scope.startRefresh();
  
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
  $scope.decreaseTemp = function(){
    $scope.myData.sliderValue--;
  }
  $scope.increaseTemp = function(){
    $scope.myData.sliderValue++;
  }
  
  $scope.$watch('myData.sliderValue',function(){
    $timeout.cancel($scope.settingCurrentSetpoint);
    $scope.settingCurrentSetpoint = $timeout($scope.setCurrentSetpoint, 1000);
  });
  $scope.setCurrentSetpoint = function(){
    $scope.stopRefresh();
    var url = encodeURIComponent('http://192.168.1.72:3480/data_request?id=lu_action&output_format=json&DeviceNum=4&serviceId=urn:upnp-org:serviceId:TemperatureSetpoint1&action=SetCurrentSetpoint&NewCurrentSetpoint='+$scope.myData.sliderValue);
    var responsePromise = $http.get("/get.php?url="+url);
    
    responsePromise.success(function(data, status, headers, config) {
      console.log(data);
    });
    responsePromise.error(function(data, status, headers, config) {
      alert("AJAX failed!");
    });
    $scope.startRefresh();
  };
  $scope.setModeTarget = function(deviceID,ModeTarget){
    $scope.stopRefresh();
    var url = encodeURIComponent('http://192.168.1.72/port_3480/data_request?id=lu_action&output_format=json&action=SetModeTarget&serviceId=urn:upnp-org:serviceId:HVAC_UserOperatingMode1&rand='+Math.random()+'&DeviceNum='+deviceID+'&NewModeTarget='+ModeTarget);
    var responsePromise = $http.get("/get.php?url="+url);
    responsePromise.success(function(data, status, headers, config) {
      console.log(data);
    });
    responsePromise.error(function(data, status, headers, config) {
      alert("AJAX failed!");
    });
    $scope.startRefresh();
  }
});
