Face-Roulette
=====================
![alt text](logos/logo.jpg)

## 1. 서버 실행방법

```
$ node server.js
```

```
1. nvm install stable
2. npm install
3. node server.js
```

* Kakao Plus friend 에서 "페이스룰렛"을 검색하세요.
* 사진을 업로드하거나, 찍으시면 랜덤하게 한 명을 뽑습니다.
* 감정분석, 나이예측, 닮은사람 찾기등을 기준으로 뽑을 수도 있습니다.
* 기념사진도 찍고, 재미있게 밥값내기도 하세요!

## 2. Using
	1. Azure Face API
	2. Kakao Plus friend API
	3. Node.js


## 3. MongoDB 초기 설정
`use <DB_NAME>`: DB 생성 및 현재 선택된 DB로 지정  
`db.createCollection(<COLLECTION_NAME>)`: 컬렉션 생성  
`db.<COLLECTION_NAME>.find()`: 컬렉션에 저장된 모든 도큐먼트를 불러옴  
  
DB이름과 컬렉션 이름은 `db-utils.js`에 저장된 상수값 참고