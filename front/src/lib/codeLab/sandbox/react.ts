// React 스타터킷 런타임. runtime.js 가 DevTools 훅을 먼저 설치한 뒤 로드된다.
import * as React from "react";

import * as ReactDOMClient from "react-dom/client";

Object.assign(window, { React, ReactDOMClient });
