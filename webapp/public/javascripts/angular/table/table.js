'use strict';

function makeHeader() {
  return {
    restrict: 'EA',
    transclude: true,
    require: '^?terrama2Table2',
    scope: {
      title: '='
    },
    template: '<td><ng-transclude></ng-transclude></td>'
  };
}

angular.module('terrama2.table', ['terrama2'])
  .run(function($templateCache) {
    $templateCache.put('filterTable.html',
      "<div class=\"col-md-10\">" +
        "<div class=\"form-group\">" +
          "<input class=\"form-control\" id=\"searchNameInput\" ng-model=\"model\" style=\"margin-top: 24px;\" placeholder=\"{{ placeholder }}\" type=\"text\">"+
        "</div>"+
      "</div>" +
      "<div class=\"col-md-2\">" +
        "<div class=\"form-group\">" +
          "<button class=\"btn btn-default\" style=\"margin-top: 24px;\"><i class=\"fa fa-search\" style=\"margin-right: 5px;\"></i>{{ i18n.__('Advanced') }}</button>" +
        "</div>" +
      "</div>");

    $templateCache.put("mockTable.html",
    "<div>" +
      "<terrama2-modal-box title='title' class='\"modal-danger\"' modal-type='\"modal-sm\"' modal-id='\"removalID\"' properties='properties'>" +
        "<terrama2-content>{{ i18n.__(\"Are you sure to remove \" + target +\"?\") }}</terrama2-content>" +
        "<terrama2-button class='btn btn-primary' ng-click='remove({object: target});'>OK</terrama2-button>" +
        "<terrama2-button class='btn btn-primary' ng-click='link({object: target});'>Cancel</terrama2-button>" +
      "</terrama2-modal-box>" +
      "<div class='col-md-12'>" +
        "<div class=\"col-md-12\">" +
          "<div class=\"col-md-8\" ng-transclude='filterSlot'>" +
            "<terrama2-filter-table ng-model=\"search.input\"></terrama2-filter-table>" +
          "</div>" +
          "<div class=\"col-md-4 terrama2-nopadding-box\" ng-transclude='extraButtonsSlot'>" +
            "<div class='col-md-2'>" +
              "<div class=\"form-group\">" +
                "<a ng-href=\"{{ linkToAdd }}\" class=\"btn btn-default pull-right\" style=\"margin-top: 24px;\">" +
                  "<i class=\"fa fa-plus\"></i>" +
                "</a>" +
              "</div>" +
            "</div>" +
          "</div>" +
        "</div>" +
      "</div>" +
      "<div class='col-md-12' ng-transclude='contentSlot'></div>" +
    "</div>");
  })
  .directive('terrama2Table', function(i18n) {
    return {
      restrict: 'E',
      templateUrl: '/javascripts/angular/table/templates/table.html',
      replace: true,
      scope: {
        fields: '=fields',
        model: '=model',
        link: '&',
        icon: '&',
        orderElementby: '=?orderBy',
        iconProperties: '=?iconProperties',
        linkToAdd: '=?linkToAdd',
        context: '=context',
        remove: '&?',
        run: '&?',
        extra: '=?extra'
      },

      controller: function($scope, $http, i18n) {
        $scope.i18n = i18n;
        $scope.searchInput = '';
        $scope.selected = {};
        $scope.emptyMessage = 'No ' + ($scope.context || 'data') + ' found';

        // defines display fields in table
        $scope.displayFields = [];
        // fields identifiers
        $scope.identityFields = [];

        var cacheLinks = {};

        $scope.extra = $scope.extra ? $scope.extra : {};

        $scope.objectToRemove = null;

        $scope.setModelSelected = function(modelSelected) {
          $scope.selected = modelSelected;
        }

        $scope.confirmRemoval = function(object) {
          $scope.objectToRemove = object;

          $('#myModal').modal();
        };

        $scope.resetObjectToRemove = function() {
          $scope.objectToRemove = null;
        };

        // remove function
        $scope.removeOperation = function() {
          if($scope.objectToRemove !== null) {
            var object = $scope.objectToRemove;
            $scope.resetObjectToRemove();

            // callback
            var callback = $scope.extra.removeOperationCallback;
            $http({
              method: 'DELETE',
              url: $scope.remove({object: object})
            }).success(function(response) {
              $scope.model.forEach(function(element, index, arr) {
                if (element.id == object.id)
                  arr.splice(index, 1);

                if ($scope.isFunction(callback))
                  callback(null, response);
              });

            }).error(function(err) {
              if ($scope.isFunction(callback))
                callback(err);
              console.log(err);
            }).finally(function() {
              // $scope.selected = {};
            });
          }
        };

        if (!$scope.iconProperties)
          $scope.iconProperties = {type: 'img'};

        $scope.makeLink = function(element) {
          var link = cacheLinks[element.id];
          if (!link) {
            link = $scope.link()(element);
            cacheLinks[element.id] = link;
          }
          return link;
        }

        $scope.processField = function(key, obj) {
          if (key.indexOf('.') > 0) {
            var arr = key.split(".");
            var output = obj;

            arr.forEach(function(elm) {
              output = output[elm];
            })
            return output;
          } else {
            return obj[key];
          }
        }

        $scope.$watch('fields', function(fields) {
          // processing fields
          fields.forEach(function(field) {
            if (field instanceof Object) {
              // todo: validation throwing errors
              $scope.displayFields.push(field.as);
              $scope.identityFields.push(field.key);
            } else {
              $scope.displayFields.push(field);
              $scope.identityFields.push(field);
            }
          });

        });

        $scope.width = $scope.iconProperties.width || 24;
        $scope.width = $scope.iconProperties.height || 24;

        $scope.isFunction = function(target) {
          return angular.isFunction(target);
        };

        $scope.capitalizeIt = function(str) {
          return str.charAt(0).toUpperCase() + str.slice(1);
        }
      }
    }
  })

  .directive('terrama2TdHeader', function(i18n) {
    return makeHeader();
  })

  .directive('terrama2ModalMessages', function(i18n){
    return {
      transclude: true,
      link: function(scope, element, attrs, transclude){
      },
      restrict: 'E',
      priority: 1100,
      replace: true,
      template: function(tElm, tAttrs) {
        var template = ""+
          '<div id="messagesModal" class="modal fade" role="dialog">' + 
            '<div class="modal-dialog">'+

              '<div class="modal-content">' +
                '<div class="modal-header">' +
                  '<button type="button" class="close" data-dismiss="modal">&times;</button>' +
                  '<h4 class="modal-title">'+ i18n.__("Messages")+ '</h4>' +
                '</div>'+
                '<div class="modal-body" ng-transclude></div>'+
                '<div class="modal-footer">'+
                  '<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>'+
                '</div>'+
              '</div>'+
            '</div>'+
          '</div>';
        return template;
      }
    }
  })

  .directive('terrama2TableView', function(i18n) {
    return {
      restrict: 'E',
      priority: 1001,
      replace: true,
      template: function(tElm, tAttrs) {
        var context = i18n.__('No ' + (tAttrs.context || "data") + " found.");
        var expression = tAttrs.expression;
        var td = "", th = "";
        var counter = 0;

        angular.forEach(tElm.find('terrama2-td'), function(column){
          var klass = column.className;
          var lnk = column.attributes.link;
          var content = column.innerHTML;
          if (lnk) {
            content = "<a ng-href='" + lnk.value + "'>" + content + "</a>";
          }
          th = th + "<th class='" + klass + "'>" + column.title + "</th>";
          if (column.attributes.showMoreInfo){
            var fillModalFunction = column.attributes.fillModal.textContent;
            td = td + "<td class='" + klass + "'> <a href='' data-toggle='modal' data-target='#messagesModal' ng-click='" + fillModalFunction + "'>" + content +"</a></td>";  
          }
          else {
            td = td + "<td class='" + klass + "'>" + content + "</td>";
          }
          
          ++counter;
        });

        // TODO: Fix the ng if. "model.length" is hardcoded. It should get from expression
        var template = '<table class="table table-hover">' +
            '<thead>' + th + '</thead>' +
            '<tbody>' +
            '<tr ng-repeat="' + expression + '">'+ td +'</tr>' +
            '<tr ng-if="model.length === 0"><td colspan="' +  counter + '">'+ context +'</td></tr>' +
            '</tbody>' +
            '</table>';
        return template;
      }
    }
  })
  .directive('terrama2Table2Filter', function($compile, i18n) {
    return {
      restrict: 'E',
      priority: 1500,
      transclude: true,
      templateUrl: "/javascripts/angular/table/templates/tbl.html",
      compile: function pre(element, attrs) {
        var repeat = element.find('terrama2-table2');
        repeat.attr('expression', attrs.expression);
        $compile(element.contents());
        return this.link;
      },
      scope: true,
      link: function(scope, element, attrs, transclude) {
        scope.link = attrs.link;

        scope.$watch('model', function(value) {
          console.log(value);
        });

        transclude(scope.$parent, function(clone, scope) {
          element.append(clone());
        });
      }
    };
  })

  .directive('terrama2TableHeader', function(i18n) {
    return {
      restrict: 'E',
      transclude: {
        "extraButtonsSlot": "?terrama2Btn"
      },

      templateUrl: "/javascripts/angular/table/templates/tableFilter.html",
      link: function(scope, element, attrs, transclude) {
        scope.linkToAdd = attrs.linkToAdd;
      }
    };
  })

  .directive('terrama2FilterTable', function (i18n) {
    return {
      restrict: 'E',
      priority: 2000,
      templateUrl: 'filterTable.html',
      require: "ngModel",
      scope: {
        model: "=ngModel"
      },
      controller: function($scope) {
        $scope.i18n = i18n;
      }
    };
  })

  .directive("terrama2MockTable", function(i18n) {
    return {
      restrict: 'E',
      templateUrl: "mockTable.html",
      transclude: {
        "filterSlot": "?div",
        "extraButtonsSlot": "?terrama2Div",
        "contentSlot": "terrama2TableView"
      },
      scope: {
        title: "=",
        remove: '&onRemove',
        target: '='
      },
      controller: function($scope) {
         $scope.i18n = i18n;
        }
    };
  })

  .directive("terrama2SelectTable", function(i18n) {
    /**
     * Defines a selectable table
     * @param {Object} model - A javascript object with structure. {name: "GroupName", children: NodeArray}
     * @param {Array<?>} selecteds - A javascript array with
     * @todo specify a groups via expression like:
     * <terrama2-select-table model="model" groups="{'GRID': 'node.data_series_semantics.data_series_type_name === \'GRID\''}" attrs>
     */
    return {
      restrict: 'E',
      templateUrl: '/javascripts/angular/table/templates/selectTable.html',
      scope: {
        modelTitle: '=',
        model: '=model',
        selecteds: '=',
        options: '=',
        onSelected: '&?'
      },
      controller: function($scope) {
        $scope.selectedNode = null;
        $scope.onConfirm = function() {
          if ($scope.selectedNode === null) {
            return;
          }
          $scope.onSelected($scope.selectedNode);
        };
      }
    };
  });
