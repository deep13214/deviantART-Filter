//angular.module('deviantArtFilter.components', [])
angular.module('deviantArtFilter.components.OptionsPanel', ['rzModule', 'schemaForm'])

    .controller('OptionsPanelCtrl', ['$scope', function ($scope) {

        $scope.labels = {
            'optionsHeading': browser.i18n.getMessage('OptionsHeading'),
            'options': browser.i18n.getMessage('LabelOptions'),
        };
        console.log('[Component] OptionsPanelCtrl :: Labels', $scope.labels);

        $scope.alerts = [];

        $scope.closeAlert = function (index) {
            $scope.alerts.splice(index, 1);
        };

        $scope.changeOption = function (id, value) {
            console.log('[Component] OptionsPanelCtrl.changeOption()', id, value);
            const option = $scope.schema.properties[id];
            console.log('[Component] OptionsPanelCtrl.changeOption() :: Option', option);

            if ($scope.OptionsPanelCtrlForm[id] === undefined || $scope.OptionsPanelCtrlForm[id].$valid) {
                browser.runtime.sendMessage({
                    'action': 'set-option',
                    'data': {
                        'option': id,
                        'value': value
                    }
                }).catch((error) => {
                    console.log('[Component] OptionsPanelCtrl.changeOption() :: Error', error);
                    $scope.$apply(() => {
                        $scope.alerts.push({
                            'type': 'danger',
                            'msg': browser.i18n.getMessage('OptionUpdateError', option.title || id, [error.message])
                        });
                    });
                });
            }
        };

        $scope.schema = {};
        $scope.form = [];
        $scope.options = {};

        $scope.config = {
            'formDefaults': {
                'disableSuccessState': true,
                'feedback': false,
                'ngModelOptions': {
                    'debounce': 500 // TODO: this should only be for text-based input fields
                }
            },
            'validationMessage': {
                '101': browser.i18n.getMessage('OptionLabelMinimum') + ': {{schema.minimum}}',
                '103': browser.i18n.getMessage('OptionLabelMaximum') + ': {{schema.maximum}}',
                '302': browser.i18n.getMessage('OptionLabelRequired')
            }
        };

        $scope.getOptionsSchemaForm = function () {
            console.log('[Component] OptionsPanelCtrl.getOptionsSchemaForm()');
            $scope.loading = browser.i18n.getMessage('GenericLoading', [$scope.labels.options]);

            browser.runtime.sendMessage({
                'action': 'get-options-schema-form'
            }).then((response) => {
                console.log('[Component] OptionsPanelCtrl.getOptionsSchemaForm() :: Response', response);
                $scope.schema = response.schema;
                $scope.form = response.form;
                $scope.options = response.values;

                $scope.$watchCollection('options', function(newOptions, oldOptions) {
                    for (var prop in newOptions) {
                        if (newOptions[prop] !== oldOptions[prop]) {
                            $scope.changeOption(prop, newOptions[prop]);
                        }
                    }
                });
            }).catch((error) => {
                console.error('[Component] OptionsPanelCtrl.getOptionsSchemaForm() :: Error', error);
                $scope.alerts.push({
                    'type': 'danger',
                    'msg': browser.i18n.getMessage('GenericLoadingError', [$scope.labels.options, error.message])
                });
            }).finally(() => {
                console.log('[Component] OptionsPanelCtrl.getOptionsSchemaForm() :: Finally');
                $scope.loading = false;
                $scope.$apply();
                $scope.$broadcast('schemaFormRedraw');
            });
        };
        $scope.getOptionsSchemaForm();

    }])

    .directive('optionsPanel', function () {
        return {
            'templateUrl': 'template.html',
            'restrict': 'E',
            'replace': true,
            'scope': true,
            'require': ['OptionsPanelCtrl'],
            'controller': 'OptionsPanelCtrl'
        };
    });
