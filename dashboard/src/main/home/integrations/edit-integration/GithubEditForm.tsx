import React, { Component } from "react";
import styled from "styled-components";

import EditIntegrationForm, { EditIntegrationFormPropsType } from "./EditIntegrationForm";

type PropsType = EditIntegrationFormPropsType;

type StateType = {
};

export default class GithubEditForm extends Component<PropsType, StateType> implements EditIntegrationForm {

  handleSubmit = () => {

  };

  render() {
    return (
      <StyledForm>
        <Button
          color={"#616FEEcc"}
          onClick={this.props.onCancel}>
          Cancel
        </Button>
        <Button
          color={"#DD0000"}
          onClick={() => { }}>
          Delete
        </Button>
      </StyledForm>
    );
  }
}

const StyledForm = styled.div`
  position: relative;
  padding: 20px;
  text-align: right;
`;


const Button = styled.button`
  height: 35px;
  font-size: 13px;
  font-weight: 500;
  font-family: "Work Sans", sans-serif;
  color: white;
  padding: 6px 20px 7px 20px;
  text-align: left;
  border: 0;
  border-radius: 5px;
  margin-left: 15px;
  background: ${(props) => (!props.disabled ? props.color : "#aaaabb")};
  box-shadow: ${(props) =>
    !props.disabled ? "0 2px 5px 0 #00000030" : "none"};
  cursor: ${(props) => (!props.disabled ? "pointer" : "default")};
  user-select: none;
  :focus {
    outline: 0;
  }
  :hover {
    filter: ${(props) => (!props.disabled ? "brightness(120%)" : "")};
  }
`;