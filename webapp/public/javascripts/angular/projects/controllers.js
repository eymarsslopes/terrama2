angular.module('terrama2.projects')
  .controller('Registration', ['$scope', '$http', '$window',
  function($scope, $http, $window) {
    $scope.forms = {};
    $scope.isSubmiting = false;
    $scope.errorFound = "";
    $scope.formName = "form";

    $scope.project = configuration.project || {};
    $scope.project.version = 4;

    $scope.alertBox = {};
    $scope.display = false;
    $scope.alertLevel = null;
    $scope.close = function() {
      $scope.display = false;
    };

    var makeDialog = function(level, bodyMessage, show, title) {
      $scope.alertBox.title = title || "Project Registration";
      $scope.alertBox.message = bodyMessage;
      $scope.alertLevel = level;
      $scope.display = show;
    };

    $scope.save = function(frm) {
      $scope.close();
      $scope.$broadcast('formFieldValidation');

      if ($scope.forms.projectForm.$invalid){
        makeDialog("alert-danger", "There are invalid fields on form", true);
      }

      if ($scope.forms.projectForm.$valid) {
        $scope.isSubmiting = true;
        $http({
          method: configuration.method,
          url: configuration.url,
          data: $scope.project
        }).success(function(project) {
          console.log(project);
          $scope.errorFound = "";
          $window.location.href = "/configuration/projects?token=" + project.token;
        }).error(function(err) {
          $scope.errorFound = err.message;
          console.log(err);
          $scope.form.name.$invalid = true;

        }).finally(function(){
          $scope.isSubmiting = false;
        });
      }
    };
  }])