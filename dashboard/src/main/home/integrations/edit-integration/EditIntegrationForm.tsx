import React, { Component } from "react";

type PropsType = {
  onCancel: () => void;
};

export type EditIntegrationFormPropsType = PropsType;

type StateType = {};

export default abstract class EditIntegrationForm extends Component<PropsType, StateType> {
  state = {};

}

export class EmptyForm extends EditIntegrationForm {
  render = () => <div>
    No edit options!
  </div>
}
