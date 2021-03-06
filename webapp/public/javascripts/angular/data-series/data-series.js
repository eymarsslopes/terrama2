angular.module('terrama2.listDataSeries', ['terrama2.table', 'terrama2.services', 'terrama2.components.messagebox'])
  .controller("ListController", ['$scope', 'DataSeriesFactory', 'Socket',function($scope, DataSeriesFactory,Socket) {
    var isDynamic = false;
    var queryParams = {};

    Socket.on('errorResponse', function(response){
      $scope.display = true;
      $scope.alertLevel = "alert-danger";
      $scope.alertBox.message = response.message;
    });

    Socket.on('runResponse', function(response){
      $scope.display = true;
      $scope.alertLevel = "alert-success";
      $scope.alertBox.message = "The process was started successfully";
    })

    if (configuration.dataSeriesType == "static") {
      $scope.dataSeriesType = configuration.dataSeriesType;
    } else {
      $scope.dataSeriesType = 'dynamic';
      queryParams['collector'] = true;
    }

    queryParams['type'] = $scope.dataSeriesType;

    $scope.model = [];
    $scope.fields = [];

    $scope.remove = function(object) {
      return "/api/DataSeries/" + object.id + "/delete";
    };

    $scope.extra = {
      removeOperationCallback: function(err, data) {
        $scope.display = true;
        if (err) {
          $scope.alertLevel = "alert-danger";
          $scope.alertBox.message = err.message;
          return;
        }

        $scope.alertLevel = "alert-success";
        $scope.alertBox.message = data.name + " removed";
      },
      showRunButton: configuration.showRunButton,
      canRun: function(object){
        var foundCollector = configuration.collectors.find(function(collector){
          return collector.output_data_series == object.id;
        });
        var foundAnalysis = configuration.analysis.find(function(analysi){
          return analysi.dataSeries.id == object.id;
        })
        return foundCollector || foundAnalysis;
      },
      run: function(object){        
        var service_instance = this.canRun(object);
        var process_ids = {
          "ids":[service_instance.id],
          "service_instance": service_instance.service_instance_id
        }        
        Socket.emit('run', process_ids);        
      }
    };
    $scope.method = "{[ method ]}";
    $scope.alertLevel = "alert-success";
    $scope.alertBox = {
      title: "Data Series",
      message: configuration.message
    };
    $scope.resetState = function() { $scope.display = false; };
    $scope.display = configuration.message !== "";

    DataSeriesFactory.get(queryParams).success(function(data) {
      $scope.model = data instanceof Array ? data : [];

      // processing type
      $scope.model.forEach(function(instance) {
        var value;
        switch(instance.data_series_semantics.data_series_type_name) {
          case globals.enums.DataSeriesType.DCP:
            value = "DCP";
            break;
          case globals.enums.DataSeriesType.ANALYSIS_MONITORED_OBJECT:
          case globals.enums.DataSeriesType.OCCURRENCE:
            value = "Occurrence";
            break;
          case globals.enums.DataSeriesType.GRID:
            value = "Grid";
            break;
          case globals.enums.DataSeriesType.STATIC_DATA:
            value = "Static";
            break;
          default:
            value = instance.data_series_semantics.name;
        }

        instance.model_type = value;
      });
      $scope.fields = [{key: 'name', as: "Name"}, {key: "model_type", as: "Type"}];
    }).error(function(err) {

    });

    $scope.link = configuration.link || null;

    $scope.linkToAdd = configuration.linkToAdd || null;

    $scope.iconFn = configuration.iconFn || null;

    $scope.iconProperties = configuration.iconProperties || {};
  }]);
