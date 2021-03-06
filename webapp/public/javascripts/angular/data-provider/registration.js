'use strict';

var app = angular.module("terrama2.dataprovider.registration", ['terrama2', 'schemaForm', 'terrama2.components.messagebox']);

app.controller("RegisterController", ["$scope", "$http", "$q", "$window", "$httpParamSerializer", "$location",
  function($scope, $http, $q, $window, $httpParamSerializer, $location) {

  var model = {}

  var conf = configuration;
  if (conf.dataProvider.uriObject) {
    for(var k in conf.dataProvider.uriObject) {
      if (conf.dataProvider.uriObject.hasOwnProperty(k)) {
        model[k] = decodeURI(conf.dataProvider.uriObject[k]);
      }
    }
  }

  // forcing port value to number
  if (model.port) {
    model.port = parseInt(model.port);
  }

  $scope.model = model;
  $scope.serverErrors = {};

  $scope.forms = {};
  $scope.css = {
    boxType: "box-solid"
  }

  if (conf.fields) {
    $scope.schema = {
    type: "object",
      properties: conf.fields.properties,
      required: conf.fields.required
    };

    $scope.options = {};
  } else
    $scope.schema = {};

  $scope.form = conf.fields.display || [];

  //  redraw form
  if ($scope.form) {
    $scope.$broadcast('schemaFormRedraw');
  }

  $scope.schemeList = [];
  $http.get("/api/DataProviderType/", {}).success(function(typeList) {
    $scope.typeList = typeList;
  }).error(function(err) {
    console.log("err type: ", err);
  });

  var makeRedirectUrl = function(extra) {
    var redirectUrl = conf.redirectTo.redirectTo || "/configuration/providers/";
    redirectUrl += (redirectUrl.indexOf('?') === -1) ? '?' : '&';

    var redirectData = Object.assign(conf.redirectTo, extra instanceof Object ? extra : {});
    delete redirectData.redirectTo;

    return redirectUrl + $httpParamSerializer(redirectData);
  }

  $scope.redirectUrl = makeRedirectUrl();

  $scope.errorFound = false;
  $scope.isEditing = conf.isEditing;
  $scope.alertBox = {};
  $scope.isChecking = false;
  $scope.message = "";
  $scope.remoteFieldsRequired = false;
  $scope.dataProvider = {
    name: conf.dataProvider.name,
    description: conf.dataProvider.description,
    project: conf.project,
    active: conf.dataProvider.active,
    protocol: conf.dataProvider.data_provider_type_name
  };

  $scope.initActive = function() {
    $scope.dataProvider.active = (conf.dataProvider.active === false || conf.dataProvider.active) ? conf.dataProvider.active : true;
  };

  $scope.onSchemeChanged = function(ref) {
    $scope.typeList.forEach(function(dataProviderType) {
      if (dataProviderType.name === $scope.dataProvider.protocol) {
        // temp code for port changing
        $scope.model = {};
        $scope.schema = {
          type: "object",
          properties: dataProviderType.properties,
          required: dataProviderType.required || []
        };

        if (dataProviderType.display) {
          $scope.form = dataProviderType.display;
        } else {
          $scope.form = ["*"];
        }

        $scope.$broadcast('schemaFormRedraw');
      }
    });
  };

  $scope.isValidDataProviderTypeForm = function(form) {
    return $scope.forms.connectionForm.$valid;
  };

  $scope.save = function() {
    $scope.resetState();
    $scope.$broadcast('formFieldValidation');

    // calling auto generate form validation
    $scope.$broadcast('schemaFormValidate');

    var isConnectionFormValid = $scope.isValidDataProviderTypeForm($scope.forms.connectionForm);
    if (!$scope.forms.dataProviderForm.$valid || !isConnectionFormValid) {
      $scope.alertBox.title = "Data Provider Registration";
      $scope.alertBox.message = "There are invalid fields on form";
      $scope.errorFound = true;
      return;
    }

    $scope.alertBox.title = "Data Provider Registration";
    $scope.message = "";
    $scope.errorFound = false;

    var formData = $scope.dataProvider;
    formData.uriObject = Object.assign({protocol: $scope.dataProvider.protocol}, $scope.model);

    $http({
      url: conf.saveConfig.url,
      method: conf.saveConfig.method,
      data: formData
    }).success(function(data) {
      $scope.isEditing = true;

      var defaultRedirectTo = "/configuration/providers?id=" + data.result.id + "&method=" + conf.saveConfig.method + "&";

      var redirectData = makeRedirectUrl({data_provider_id: data.result.id}) + "&token=" + data.token;

      // disable fields
      $scope.options = {formDefaults: {readonly: true}};

      $window.location.href = (redirectData || defaultRedirectTo);
    }).error(function(err) {
      $scope.errorFound = true;
      $scope.alertBox.message = err.message;
      $scope.serverErrors = err.errors || {};
      console.log(err);
    });
  };

  $scope.resetState = function() {
    $scope.errorFound = false;
    $scope.alertBox.message = "";
  };

  $scope.checkConnection = function(form) {
    $scope.model = $scope.model;
    $scope.$broadcast('schemaFormValidate');

    // var tm2Errors = $scope.forms.connectionForm.$error.terrama2Error || [];
    // // removing terrama2 server error from schema form. TODO: a factory??
    // while(tm2Errors.length !== 0) {
    //   var field = tm2Errors[0];
    //   var schemaformField = "schemaForm.error." + field.$name;
    //   // pop field error
    //   $scope.$broadcast(schemaformField, "terrama2Error", true, form.$name);
    // }

    if (!$scope.isValidDataProviderTypeForm(form))
      return;

    $scope.isChecking = true; // for handling loading page

    // Timeout in seconds for handling connections
    $scope.timeOutSeconds = 8;

    // Function for requests success, error and timeout
    var makeRequest = function() {
      var timeOut = $q.defer();
      var result = $q.defer();
      var expired = false;
      setTimeout(function() {
        expired = true;
        timeOut.resolve();
      }, 1000 * $scope.timeOutSeconds);

      var params = $scope.model;
      params.protocol = $scope.dataProvider.protocol;

      var httpRequest = $http({
        method: "POST",
        url: "/uri/",
        data: params,
        timeout: timeOut.promise
      });

      httpRequest.success(function(data) {
        result.resolve(data);
      });

      httpRequest.error(function(err) {
        if (expired) {
          result.reject({message: "Timeout: Request took longer than " + $scope.timeOutSeconds + " seconds."});
        } else {
          result.reject(err);
        }
      });

      return result.promise;
    };

    var request = makeRequest();

    $scope.alertBox.title = "Connection Status";

    request.then(function(data) {
      if (data.message){ // error found
        $scope.errorFound = true;
        $scope.alertBox.message = data.message;
      } else {
        $scope.errorFound = false;
        $scope.alertBox.message = "Connection Successful";
      }
    }).catch(function(err) {
      $scope.errorFound = true;
      $scope.alertBox.message = err.message;

      // todo: notify schemaFormFields
      // var errors = (err.errors || {});
      // for(var key in errors) {
      //   if (errors.hasOwnProperty(key)) {
      //     $scope.$broadcast("schemaForm.error." + key, "terrama2Error", errors[key].message, form.$name);
      //   }
      // }
    }).finally(function() {
      $scope.isChecking = false;
    });
  };
}]);
