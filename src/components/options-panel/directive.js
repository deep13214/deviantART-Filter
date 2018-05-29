//angular.module('deviantArtFilter.components', [])
angular.module('deviantArtFilter.components.OptionsPanel', ['schemaForm', 'ngMessages'])

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

        $scope.changeOption = function (modelValue, form) {
            console.log('[Component] OptionsPanelCtrl.changeOption()', modelValue, form);
            if ($scope.OptionsPanelCtrlForm[form.schema.id].$valid) {
                browser.runtime.sendMessage({
                    'action': 'set-option',
                    'data': {
                        'option': form.schema.id,
                        'value': modelValue
                    }
                }).catch((error) => {
                    console.log('[Component] OptionsPanelCtrl.changeOption() :: Error', error);
                    $scope.$apply(() => {
                        $scope.alerts.push({
                            'type': 'danger',
                            'msg': browser.i18n.getMessage('OptionUpdateError', form.schema.name, [error.message])
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
                'onChange': $scope.changeOption
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
