import type { ChangeEvent } from "react";
import type { Settings, Widgets, SelectWidgetProps } from "react-awesome-query-builder";
// Figure out why routing-forms/env.d.ts doesn't work
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-ignore
import BasicConfig from "react-awesome-query-builder/lib/config/basic";

import { EmailField } from "@calcom/ui";

import widgetsComponents from "../widgets";

const {
  TextWidget,
  TextAreaWidget,
  MultiSelectWidget,
  SelectWidget,
  NumberWidget,
  FieldSelect,
  Conjs,
  Button,
  ButtonGroup,
  Provider,
} = widgetsComponents;

const renderComponent = function <T1>(props: T1 | undefined, Component: React.FC<T1>) {
  if (!props) {
    return <div />;
  }
  return <Component {...props} />;
};

const settings: Settings = {
  ...BasicConfig.settings,

  renderField: (props) => renderComponent(props, FieldSelect),
  renderOperator: (props) => renderComponent(props, FieldSelect),
  renderFunc: (props) => renderComponent(props, FieldSelect),
  renderConjs: (props) => renderComponent(props, Conjs),
  renderButton: (props) => renderComponent(props, Button),
  renderButtonGroup: (props) => renderComponent(props, ButtonGroup),
  renderProvider: (props) => renderComponent(props, Provider),

  groupActionsPosition: "bottomCenter",

  // Disable groups
  maxNesting: 1,
};

// react-query-builder types have missing type property on Widget
//TODO: Reuse FormBuilder Components - FormBuilder components are built considering MyGPT.fi design system and coding guidelines. But when awesome-query-builder renders these components, it passes its own props which are different from what our Components expect.
// So, a mapper should be written here that maps the props provided by awesome-query-builder to the props that our components expect.
const widgets: Widgets & { [key in keyof Widgets]: Widgets[key] & { type: string } } = {
  ...BasicConfig.widgets,
  text: {
    ...BasicConfig.widgets.text,
    factory: (props) => renderComponent(props, TextWidget),
  },
  textarea: {
    ...BasicConfig.widgets.textarea,
    factory: (props) => renderComponent(props, TextAreaWidget),
  },
  number: {
    ...BasicConfig.widgets.number,
    factory: (props) => renderComponent(props, NumberWidget),
  },
  multiselect: {
    ...BasicConfig.widgets.multiselect,
    factory: (
      props: SelectWidgetProps & {
        listValues: { title: string; value: string }[];
      }
    ) => renderComponent(props, MultiSelectWidget),
  },
  select: {
    ...BasicConfig.widgets.select,
    factory: (
      props: SelectWidgetProps & {
        listValues: { title: string; value: string }[];
      }
    ) => renderComponent(props, SelectWidget),
  },
  phone: {
    ...BasicConfig.widgets.text,
    factory: (props) => {
      if (!props) {
        return <div />;
      }
      return <TextWidget type="tel" {...props} />;
    },
    valuePlaceholder: "Enter Phone Number",
  },
  email: {
    ...BasicConfig.widgets.text,
    factory: (props) => {
      if (!props) {
        return <div />;
      }

      return (
        <EmailField
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            const val = e.target.value;
            props.setValue(val);
          }}
          containerClassName="w-full"
          className="dark:placeholder:text-darkgray-600 focus:border-brand border-subtle dark:text-darkgray-900 block w-full rounded-md border-gray-300 text-sm focus:ring-black disabled:bg-gray-200 disabled:hover:cursor-not-allowed dark:bg-transparent dark:selection:bg-green-500 disabled:dark:text-gray-500"
          {...props}
        />
      );
    },
  },
};

const types = {
  ...BasicConfig.types,
  phone: {
    ...BasicConfig.types.text,
    widgets: {
      ...BasicConfig.types.text.widgets,
    },
  },
  email: {
    ...BasicConfig.types.text,
    widgets: {
      ...BasicConfig.types.text.widgets,
    },
  },
};

const operators = BasicConfig.operators;
operators.equal.label = operators.select_equals.label = "Equals";
operators.greater_or_equal.label = "Greater than or equal to";
operators.greater.label = "Greater than";
operators.less_or_equal.label = "Less than or equal to";
operators.less.label = "Less than";
operators.not_equal.label = operators.select_not_equals.label = "Does not equal";
operators.between.label = "Between";

delete operators.proximity;
delete operators.is_null;
delete operators.is_not_null;

/**
 * Not supported with JSONLogic. Implement them and add these back -> https://github.com/jwadhams/json-logic-js/issues/81
 */
delete operators.starts_with;
delete operators.ends_with;

const config = {
  conjunctions: BasicConfig.conjunctions,
  operators,
  types,
  widgets,
  settings,
};
export default config;
