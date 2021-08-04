import React, { useState } from "react";

import PorterForm from "./PorterForm";
import { PorterFormData } from "./types";
import { PorterFormContextProvider } from "./PorterFormContextProvider";

type PropsType = {
  formData: any;
  valuesToOverride?: any;
  isReadOnly?: boolean;
  onSubmit?: (values: any) => void;
  renderTabContents?: (currentTab: string, submitValues?: any) => any;
  leftTabOptions?: { value: string; label: string }[];
  rightTabOptions?: { value: string; label: string }[];
  saveButtonText?: string;
  isInModal?: boolean;
  color?: string;
  addendum?: any;
  saveValuesStatus?: string;
  showStateDebugger?: boolean;
};

const PorterFormWrapper: React.FunctionComponent<PropsType> = ({
  formData,
  valuesToOverride,
  isReadOnly,
  onSubmit,
  renderTabContents,
  leftTabOptions,
  rightTabOptions,
  saveButtonText,
  isInModal,
  color,
  addendum,
  saveValuesStatus,
  showStateDebugger,
}) => {
  const hashCode = (s: string) => {
    return s.split("").reduce(function (a, b) {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);
  };

  const [currentTab, setCurrentTab] = useState(
    leftTabOptions?.length > 0
      ? leftTabOptions[0].value
      : formData.tabs?.length > 0
      ? formData.tabs[0].name
      : ""
  );

  return (
    <React.Fragment key={hashCode(JSON.stringify(formData))}>
      <PorterFormContextProvider
        rawFormData={formData as PorterFormData}
        overrideVariables={valuesToOverride}
        isReadOnly={isReadOnly}
        onSubmit={onSubmit}
      >
        <PorterForm
          showStateDebugger={showStateDebugger}
          addendum={addendum}
          isReadOnly={isReadOnly}
          leftTabOptions={leftTabOptions}
          rightTabOptions={rightTabOptions}
          renderTabContents={renderTabContents}
          saveButtonText={saveButtonText}
          isInModal={isInModal}
          color={color}
          saveValuesStatus={saveValuesStatus}
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
        />
      </PorterFormContextProvider>
    </React.Fragment>
  );
};

export default PorterFormWrapper;
