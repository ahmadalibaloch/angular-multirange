/*
The MIT License (MIT)

Copyright (c) 2014 Val Allen Samonte

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

'use strict';

angular.module('vds.multirange.mk2', ['vds.multirange'])
  .directive('vdsMultirangeMk2', function (vdsZoom) {
    return {
      required: 'ngModel',
      scope: {
        ngModel: '=',
        _zoom: '=zoom',
        _hairlines: '=hairlines',
        _options: '=options'
      },
      template:
'<div class="vds-multirange-mk2-container">' +
'<div class="vds-multirange-mk2-labels-container" ng-style="hlcStyle()">' +
'<ul class="vds-multirange-mk2-labels" ng-style="hlStyle()">' +
'<li class="vds-multirange-mk2-label" ng-repeat="range in ngModel" ng-style="{ left: (range.value*100)+\'%\', zIndex: range.z }">' +
'<span ng-show="range.name">{{ range.name }}</span>' +
'</li>' +
'</ul>' +
'</div>' +
'<vds-multirange ng-model="ngModel" style="display: block; margin: auto;" ng-style="{ width: zoom.getPercent() }"></vds-multirange>' +
'<div class="vds-multirange-mk2-hairlines-container" ng-style="hlcStyle()">'+
'<ul class="vds-multirange-mk2-hairlines" ng-style="hlStyle()">' +
'<li class="vds-multirange-mk2-hairline" ng-repeat="hairline in hairlines" ng-style="{ height: hairline.h, left: hairline.x }">' +
'<span>{{ hairline.label }}</span>' +
'</li>' +
'</ul>' +
'</div>' +
'</div>',
      link: function (scope, elem, attr) {

        // defaults
        scope._hairlines = [1/10, 1/20];
        scope._zoom =  0.96;
        var processHairlines = function () {
          scope.hairlines = [];
          var levels = scope._hairlines.length;
          var hairHeight = 12; // px
          angular.forEach( scope._hairlines, function(item, key) {
            // populate hairlines
            var mark = 0;
            for(var i=0; i<=1; i = parseFloat((i+item).toFixed(8))) {
              var hairline = {
                h: hairHeight * (1 - key / levels),
                x: (i*100)+'%'
              }
              if(key == 0) {
                hairline.label = mark;
                mark++;
              }
              scope.hairlines.push(hairline);
            }
          });
        };
        scope.$watch('_hairlines', function () {
          processHairlines();
        });
        scope.$watch('_zoom', function (n,o) {
          scope.zoom = (scope._zoom instanceof vdsZoom)? scope._zoom : new vdsZoom(scope._zoom);
        });
        scope.hlStyle = function () {
          if(typeof scope.zoom == 'undefined') { return; }
          var style = {};
          if(scope.zoom.value<1) {
            style.margin = '2 auto';
            style.width = 'calc('+scope.zoom.getPercent()+' - 10px)';
          } else {
            style.margin = '2 0';
            style.width = 'calc('+scope.zoom.getPercent()+' - '+ ( 10 - ( scope.zoom.value*5 ) ) +'px)';
          }
          return style;
        };
        scope.hlcStyle = function () {
          if(typeof scope.zoom == 'undefined') { return; }
          return {
            "margin-left": (scope.zoom.value<1)? '0' : '5px'
          }
        };
      }
    };
  })
  .factory('vdsZoom', function () {
    var Zoom = function (value, step) {
      this.value = parseFloat(value);
      this.step = step;
    };
    Zoom.prototype.getPercent = function () {
      return (this.value*100) + '%';
    }
    Zoom.prototype.setPercent = function (stringPercent) {
      this.value = parseInt(stringPercent) / 100;
    }
    return Zoom;
  });

angular.module('vds.multirange', [])
  .directive('vdsMultirange', function () {
    return {
      required: 'ngModel',
      scope: {
        ngModel: '=',
        _step: '=step'
      },
      template:
'<div class="vds-multirange-container" ng-mousemove="onMousemove($event)">' +
'<div class="vds-multirange-track"></div>' +
'<div class="vds-multirange-wrapper" ng-repeat="range in ngModel" ng-style="{ zIndex: computeZ(range) }">' +
'<vds-range class="vds-multirange" position="range.value" min="0" max="{{ precision }}" step="{{step}}">' +
'</div>' +
'</div>',
      link: function (scope, elem, attr) {
        var posx;
        scope.step = 1;
        scope.precision = 1000000;
        scope.$watch('_step', function () {
          if(typeof scope._step == 'undefined') {
            scope.step = 1;
          } else {
            scope.step = scope._step * scope.precision;
          }
        });
        scope.onMousemove = function (evt) {
          var bound = elem[0].getBoundingClientRect()
          posx = (evt.pageX - bound.left) / bound.width;
        };
        scope.computeZ = function (range) {
          range.z = 100 - Math.round(Math.abs(posx-range.value)*100);
          return range.z;
        };
      }
    };
  })
  .directive('vdsRange', function ($timeout) {
    return {
      template: '<input type="range" ng-model="rdh.mulValue">',
      restrict: 'E',
      replace: true,
      scope: {
        position: '='
      },
      link: function (scope, elem, attr) {
        var RangeDataHelper = function(value, multiplier) {
          this.value = isNaN(value)? 0 : value;
          this.multiplier = multiplier;
          Object.defineProperty(this, 'mulValue', {
            get: function() {
              return (parseFloat(this.value) * this.multiplier) +'';
            },
            set: function(val) {
              this.value = parseInt(val) / this.multiplier;
              scope.position = this.value;
            }
          });
        };
        scope.$watch('position', function (n) {
          if(typeof scope.rdh == 'undefined') {
            scope.rdh = new RangeDataHelper(n, parseInt(attr.max) || 100);
          } else {
            scope.rdh.value = n;
          }
        });
      }
    }
  });
