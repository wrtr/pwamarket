# pwamarket

< p80 ~ p81 App Shell 초기 실행시 'local host 관련 에러 발생시 조치 - 2020. 5.26 >
 - npm 및 http-server의 구버젼에서 호환성 문제로 에러가 발생(그림 4-12 App 화면이 제대로 보이지 않는 경우)하는 경우에는 아래 내용을 참고하여 실행합니다.
 - 정상 실행 확인된 node.js 및 package의 version 정보 (2020. 5.26 기준)
   node.js : 12.16.3 LTS (npm : v6.14.4)
   http-server : 0.12.3 (버젼 지정하지 않고 'npm install' 명령어로 설치)
 - 실행 절차
   npm uninstall --> node.js(12.16.3 LTS) 재설치 --> npm install --> npm start --> localhost:8080 접속
   (실습 환경에 따라 port 번호 8080은 8081 등으로 달라질 수 있습니다. npm start 후 터미널 화면에 나타나는 port 번호를 사용하세요.)
   
   
