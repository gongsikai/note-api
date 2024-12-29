// /koa-api/index.ts
// const Koa = require("koa2");
// 使用支持ts的import语法
import * as Koa from "koa2";

// const Router = require("@koa/router")
// 使用支持ts的import语法
import * as Router from "@koa/router";

// 使用支持ts的import语法
import * as mysql from "mysql";

import { koaBody } from "koa-body";

import * as cors from "@koa/cors";

import { v4 as uuidv4 } from "uuid";

const app = new Koa();
const router = new Router();

const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "12345",
  database: "notes"
});


connection.connect();
const mysqlQuery = (sqlString) => new Promise((resolve, reject) => {

  connection.query(sqlString, (error, result, fields) => {
  if (error) {
    resolve({ status: -1, data: [], msg: error });
    throw error;
  }
  console.log('sql result', result, sqlString);
  resolve({ status: 0, data: result });
  });

})
// connection.end();

mysqlQuery("select * from note where user_uuid = '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d'").then((res) => {
  const { status, data, msg } = res;
  if ( status === 0 ) console.log(data)
  else console.log(msg)
});

const resInfo = {
  userNotLogin: () => JSON.stringify({ status: -1, data: [], msg: '用户未登录' }, null, 2),
  userAlreadyExists: () => JSON.stringify({ status: -1, data: [], msg: '用户已存在' }, null, 2),
  ziduanCannotEmpty: (ziduan) => JSON.stringify({ status: -1, data: [], msg: `${ziduan}不能为空` }, null, 2),
}

const encodeSqlParams = (data) => encodeURIComponent(data);

router.get('/', (ctx, next) => {
  ctx.body = "hello world";
});

router.get('/api/note/list', async (ctx, next) => {
  // console.log("uuidV4", uuidv4())
  // const uuid = uuidv4();
  console.log('body', ctx.request.body);
  console.log('params', ctx.request.query);
  const login_uuid = ctx.request.headers.token;
  if (!login_uuid) {
    ctx.body = resInfo.userNotLogin();
    return ;
  }
  // const { user_uuid } = ctx.request.params;
  // 注意：此处是query，而在axios中是params
  // const { user_uuid } = ctx.request.query;

  const loginResult = await mysqlQuery(`select * from login where uuid = "${encodeSqlParams(login_uuid)}" limit 1;`);
  const { user_uuid } = loginResult.data[0] || {}
  // if (!user_uuid) {
  //   ctx.body = JSON.stringify({
  //     status: -1,
  //     data: [],
  //     msg: '用户未登录'
  //   }, null, 2);
  //   return ;
  // }
  if (!user_uuid) {
    ctx.body = resInfo.userNotLogin();
    return ;
  }
  const result = await mysqlQuery(`select * from note where user_uuid = '${encodeSqlParams(user_uuid)}' and is_delete = 0 order by id desc`);
  console.log("result", result)
  ctx.body = JSON.stringify(result, null, 2);
});

router.post('/api/note/add', async (ctx, next) => {
  // console.log("uuidV4", uuidv4())
  const uuid = uuidv4();
  console.log('body', ctx.request.body);
  const login_uuid = ctx.request.headers.token;
  if (!login_uuid) {
    ctx.body = resInfo.userNotLogin();
    return ;
  }
  const { content } = ctx.request.body;
  if (!content) {
    ctx.body = resInfo.ziduanCannotEmpty('content');
    return ;
  }
    
  const loginResult = await mysqlQuery(`select * from login where uuid = "${encodeSqlParams(login_uuid)}" limit 1;`);
  const { user_uuid } = loginResult.data[0] || {}
  // if (!user_uuid) {
  //   ctx.body = JSON.stringify({
  //     status: -1,
  //     data: [],
  //     msg: '用户未登录'
  //   }, null, 2);
  //   return ;
  // }
  if (!user_uuid) {
    ctx.body = resInfo.userNotLogin();
    return ;
  }
  const result = await mysqlQuery(`insert into note ( uuid, user_uuid, content ) values ( "${encodeSqlParams(uuid)}", "${encodeSqlParams(user_uuid)}", "${encodeSqlParams(content)}" );`);
  console.log("result", result)
  ctx.body = JSON.stringify(result, null, 2);
});

router.post('/api/note/del', async (ctx, next) => {
  // console.log("uuidV4", uuidv4())
  // const uuid = uuidv4();
  console.log('body', ctx.request.body);
  const login_uuid = ctx.request.headers.token;
  if (!login_uuid) {
    ctx.body = resInfo.userNotLogin();
    return ;
  }
  const { uuid: noteUuid } = ctx.request.body;
  if (!noteUuid) {
    ctx.body = resInfo.ziduanCannotEmpty('uuid');
    return ;
  }
  const loginResult = await mysqlQuery(`select * from login where uuid = "${encodeSqlParams(login_uuid)}" limit 1;`);
  const { user_uuid } = loginResult.data[0] || {}
  // if (!user_uuid) {
  //   ctx.body = JSON.stringify({
  //     status: -1,
  //     data: [],
  //     msg: '用户未登录'
  //   }, null, 2);
  //   return ;
  // }
  if (!user_uuid) {
    ctx.body = resInfo.userNotLogin();
    return ;
  }
  const result = await mysqlQuery(`update note set is_delete = 1 where user_uuid = "${encodeSqlParams(user_uuid)}" and  uuid = "${encodeSqlParams(noteUuid)}";`);
  console.log("result", result)
  ctx.body = JSON.stringify(result, null, 2);
});

router.post('/api/note/modify', async (ctx, next) => {
  // console.log("uuidV4", uuidv4())
  // const uuid = uuidv4();
  console.log('body', ctx.request.body);
  const login_uuid = ctx.request.headers.token;
  if (!login_uuid) {
    ctx.body = resInfo.userNotLogin();
    return ;
  }
  const { uuid: noteUuid, content } = ctx.request.body;
  if (!noteUuid) {
    ctx.body = resInfo.ziduanCannotEmpty('uuid');
    return ;
  }
  if (!content) {
    ctx.body = resInfo.ziduanCannotEmpty('content');
    return ;
  }
  const loginResult = await mysqlQuery(`select * from login where uuid = "${encodeSqlParams(login_uuid)}" limit 1;`);
  const { user_uuid } = loginResult.data[0] || {}
  // if (!user_uuid) {
  //   ctx.body = JSON.stringify({
  //     status: -1,
  //     data: [],
  //     msg: '用户未登录'
  //   }, null, 2);
  //   return ;
  // }
  if (!user_uuid) {
    ctx.body = resInfo.userNotLogin();
    return ;
  }
  const result = await mysqlQuery(`update note set content = "${encodeSqlParams(content)}" where user_uuid = "${encodeSqlParams(user_uuid)}" and uuid = "${encodeSqlParams(noteUuid)}";`);
  console.log("result", result)
  ctx.body = JSON.stringify(result, null, 2);
});

router.post('/api/user/add', async (ctx, next) => {
  console.log("uuidV4", uuidv4())
  const uuid = uuidv4();
  console.log('body', ctx.request.body);
  console.log('login_uuid', ctx.request.headers.token)
  const login_uuid = ctx.request.headers.token;
  // if (!login_uuid) {
  //   ctx.body = resInfo.userNotLogin();
  //   return ;
  // }
  const { name, pass } = ctx.request.body;
  if (!name) {
    ctx.body = resInfo.ziduanCannotEmpty('name');
    return ;
  }
  if (!pass) {
    ctx.body = resInfo.ziduanCannotEmpty('pass');
    return ;
  }
  const checkIsUserExists = await mysqlQuery(`select * from user where name = "${encodeSqlParams(name)}";`);
  if (checkIsUserExists.data.length) {
    ctx.body = resInfo.userAlreadyExists();
    return ;
  }
  // const loginResult = await mysqlQuery(`select * from login where uuid = "${encodeSqlParams(login_uuid)}" limit 1;`);
  // const { user_uuid } = loginResult.data[0] || {}
  // if (!user_uuid) {
  //   ctx.body = JSON.stringify({
  //     status: -1,
  //     data: [],
  //     msg: '用户未登录'
  //   }, null, 2);
  //   return ;
  // }
  // if (!user_uuid) {
  //   ctx.body = resInfo.userNotLogin();
  //   return ;
  // }
  // const { uuid: noteUuid, content } = ctx.request.body;
  // if (!noteUuid) {
  //   ctx.body = resInfo.ziduanCannotEmpty('uuid');
  //   return ;
  // }
  // if (!content) {
  //   ctx.body = resInfo.ziduanCannotEmpty('content');
  //   return ;
  // }
  const result = await mysqlQuery(`insert into user ( uuid, name, pass ) values ( "${encodeSqlParams(uuid)}", "${encodeSqlParams(name)}", "${encodeSqlParams(pass)}"  );`);
  console.log("result", result)
  ctx.body = JSON.stringify(result, null, 2);
});

router.post('/api/user/del', async (ctx, next) => {
  // console.log("uuidV4", uuidv4())
  // const uuid = uuidv4();
  console.log('body', ctx.request.body);
  // const { login_uuid } = ctx.request.body;
  // if (!login_uuid) {
  //   ctx.body = resInfo.ziduanCannotEmpty('login_uuid');
  //   return ;
  // }
  const login_uuid = ctx.request.headers.token;
  if (!login_uuid) {
    ctx.body = resInfo.userNotLogin();
    return ;
  }
  const loginResult = await mysqlQuery(`select * from login where uuid = "${encodeSqlParams(login_uuid)}" limit 1;`);
  const { user_uuid } = loginResult.data[0] || {}
  // if (!user_uuid) {
  //   ctx.body = JSON.stringify({
  //     status: -1,
  //     data: [],
  //     msg: '用户未登录'
  //   }, null, 2);
  //   return ;
  // }
  if (!user_uuid) {
    ctx.body = resInfo.userNotLogin();
    return ;
  }
  const result = await mysqlQuery(`update user set is_delete = 1 where uuid = "${encodeSqlParams(user_uuid)}";`);
  console.log("result", result)
  ctx.body = JSON.stringify(result, null, 2);
});

router.post('/api/user/modify', async (ctx, next) => {
  // console.log("uuidV4", uuidv4())
  // const uuid = uuidv4();
  console.log('body', ctx.request.body);
  // const { login_uuid, pass } = ctx.request.body;
  // if (!login_uuid) {
  //   ctx.body = resInfo.ziduanCannotEmpty('login_uuid');
  //   return ;
  // }
  // if (!pass) {
  //   ctx.body = resInfo.ziduanCannotEmpty('pass');
  //   return ;
  // }
  const { pass } = ctx.request.body;
  if (!pass) {
    ctx.body = resInfo.ziduanCannotEmpty('pass');
    return ;
  }
  const login_uuid = ctx.request.headers.token;
  if (!login_uuid) {
    ctx.body = resInfo.userNotLogin();
    return ;
  }
  const loginResult = await mysqlQuery(`select * from login where uuid = "${encodeSqlParams(login_uuid)}" limit 1;`);
  const { user_uuid } = loginResult.data[0] || {}
  if (!user_uuid) {
    ctx.body = resInfo.userNotLogin();
    return ;
  }
  // const { uuid,  } = ctx.request.body;
  if (!uuid) {
    ctx.body = resInfo.ziduanCannotEmpty('uuid');
    return ;
  }
  // const prevPassResult = await mysqlQuery(`select * from user where uuid = "${encodeSqlParams(user_uuid)}" and pass = "${encodeSqlParams(pass)}"`);
  const prevPassResult = await mysqlQuery(`select * from login where uuid = "${encodeSqlParams(login_uuid)}"`);
  if (!(prevPassResult.data.length)) {
    ctx.body = { status: -1, data: '', msg: 'token无效' }
    return ;
  }
  const result = await mysqlQuery(`update user set pass = "${encodeSqlParams(pass)}" where uuid = "${encodeSqlParams(user_uuid)}";`);
  console.log("result", result)
  ctx.body = JSON.stringify(result, null, 2);
});

router.get('/api/user/list', async (ctx, next) => {
  // console.log("uuidV4", uuidv4())
  // const uuid = uuidv4();
  console.log('body', ctx.request.body);
  // const { login_uuid } = ctx.request.body;
  // if (!login_uuid) {
  //   ctx.body = resInfo.ziduanCannotEmpty('login_uuid');
  //   return ;
  // }
  const login_uuid = ctx.request.headers.token;
  // if (!login_uuid) {
  //   ctx.body = JSON.stringify({
  //     status: -1,
  //     data: [],
  //     msg: '用户未登录'
  //   }, null, 2);
  //   return ;
  // }
  if (!login_uuid) {
    ctx.body = resInfo.userNotLogin();
    return ;
  }
  const loginResult = await mysqlQuery(`select * from login where uuid = "${encodeSqlParams(login_uuid)}" limit 1;`);
  const { user_uuid } = loginResult.data[0] || {}
  // if (!user_uuid) {
  //   ctx.body = JSON.stringify({
  //     status: -1,
  //     data: [],
  //     msg: '用户未登录'
  //   }, null, 2);
  //   return ;
  // }
  if (!user_uuid) {
    ctx.body = resInfo.userNotLogin();
    return ;
  }
  // const { uuid } = ctx.request.body;
  // if (!uuid) {
  //   ctx.body = resInfo.ziduanCannotEmpty('uuid');
  //   return ;
  // }
  const result = await mysqlQuery(`select * from user;`);
  console.log("result", result)
  ctx.body = JSON.stringify(result, null, 2);
});

router.get('/api/user/name', async (ctx, next) => {
  // console.log("uuidV4", uuidv4())
  // const uuid = uuidv4();
  console.log('body', ctx.request.body);
  // const { login_uuid } = ctx.request.body;
  // if (!login_uuid) {
  //   ctx.body = resInfo.ziduanCannotEmpty('login_uuid');
  //   return ;
  // }
  const login_uuid = ctx.request.headers.token;
  // if (!login_uuid) {
  //   ctx.body = JSON.stringify({
  //     status: -1,
  //     data: [],
  //     msg: '用户未登录'
  //   }, null, 2);
  //   return ;
  // }
  console.log('/user/name login_uuid', login_uuid)
  if (!login_uuid) {
    ctx.body = resInfo.userNotLogin();
    return ;
  }
  const loginResult = await mysqlQuery(`select * from login where uuid = "${encodeSqlParams(login_uuid)}" limit 1;`);
  const { user_uuid } = loginResult.data[0] || {}
  // if (!user_uuid) {
  //   ctx.body = JSON.stringify({
  //     status: -1,
  //     data: [],
  //     msg: '用户未登录'
  //   }, null, 2);
  //   return ;
  // }
  if (!user_uuid) {
    ctx.body = resInfo.userNotLogin();
    return ;
  }
  // const { uuid } = ctx.request.body;
  // if (!uuid) {
  //   ctx.body = resInfo.ziduanCannotEmpty('uuid');
  //   return ;
  // }
  const result = await mysqlQuery(`select * from user where uuid ="${user_uuid}";`);
  console.log("result", result)
  ctx.body = JSON.stringify({ status: 0, data: { 
    name: result.data[0].name 
  }}, null, 2);
});

router.post('/api/user/login', async (ctx, next) => {
  // console.log("uuidV4", uuidv4())
  const uuid = uuidv4();
  console.log('body', ctx.request.body);
  const { name, pass } = ctx.request.body;
  if (!name) {
    ctx.body = resInfo.ziduanCannotEmpty('name');
    return ;
  }
  if (!pass) {
    ctx.body = resInfo.ziduanCannotEmpty('login_uuid');
    return ;
  }
  const checkLogin = await mysqlQuery(`select * from user where name = "${encodeSqlParams(name)}" and pass = "${encodeSqlParams(pass)}"`);
  console.log('checkLogin', checkLogin);
  if ( !checkLogin.data.length ) {
    ctx.body = JSON.stringify({
      status: -1,
      data: [],
      msg: '用户名或密码错误'
    }, null, 2);
    return ;
  }
  // const login_uuid = ctx.request.headers.token;
  // // if (!login_uuid) {
  // //   ctx.body = JSON.stringify({
  // //     status: -1,
  // //     data: [],
  // //     msg: '用户未登录'
  // //   }, null, 2);
  // //   return ;
  // // }
  // if (!login_uuid) {
  //   ctx.body = resInfo.userNotLogin();
  //   return ;
  // }
  // const loginResult = await mysqlQuery(`select * from login where uuid = "${encodeSqlParams(login_uuid)}" limit 1;`);
  // const { user_uuid } = loginResult.data[0] || {}
  // // if (!user_uuid) {
  // //   ctx.body = JSON.stringify({
  // //     status: -1,
  // //     data: [],
  // //     msg: '用户未登录'
  // //   }, null, 2);
  // //   return ;
  // // }
  // if (!user_uuid) {
  //   ctx.body = resInfo.userNotLogin();
  //   return ;
  // }
  // const { uuid } = ctx.request.body;
  // if (!uuid) {
  //   ctx.body = resInfo.ziduanCannotEmpty('uuid');
  //   return ;
  // }
  const result = await mysqlQuery(`insert into login ( uuid, user_uuid ) values ( "${encodeSqlParams(uuid)}", "${encodeSqlParams(checkLogin.data[0].uuid)}" );`);
  console.log("result", result)
  // ctx.response.header = { token: uuid }
  ctx.set('token', uuid);
  // ctx.body = JSON.stringify(result, null, 2);
  ctx.body = JSON.stringify({
    status: 0,
    data: {
      token: uuid
    },
    msg: ''
  }, null, 2);
});

router.get('/api/login/list', async (ctx, next) => {
  // console.log("uuidV4", uuidv4())
  // const uuid = uuidv4();
  console.log('body', ctx.request.body);
  // const { login_uuid } = ctx.request.body;
  // if (!login_uuid) {
  //   ctx.body = resInfo.ziduanCannotEmpty('login_uuid');
  //   return ;
  // }
  const login_uuid = ctx.request.headers.token;
  // if (!login_uuid) {
  //   ctx.body = JSON.stringify({
  //     status: -1,
  //     data: [],
  //     msg: '用户未登录'
  //   }, null, 2);
  //   return ;
  // }
  if (!login_uuid) {
    ctx.body = resInfo.userNotLogin();
    return ;
  }
  const loginResult = await mysqlQuery(`select * from login where uuid = "${encodeSqlParams(login_uuid)}" limit 1;`);
  const { user_uuid } = loginResult.data[0] || {}
  // if (!user_uuid) {
  //   ctx.body = JSON.stringify({
  //     status: -1,
  //     data: [],
  //     msg: '用户未登录'
  //   }, null, 2);
  //   return ;
  // }
  if (!user_uuid) {
    ctx.body = resInfo.userNotLogin();
    return ;
  }
  // const { uuid } = ctx.request.body;
  // if (!uuid) {
  //   ctx.body = resInfo.ziduanCannotEmpty('uuid');
  //   return ;
  // }
  const result = await mysqlQuery(`select * from login where user_uuid = "${encodeSqlParams(user_uuid)} order by id desc";`);
  console.log("result", result)
  ctx.body = JSON.stringify(result, null, 2);
});

app
  .use(koaBody())
  .use(cors())
  .use(router.routes())
  .use(router.allowedMethods());

app.listen(3003, () => {
  console.log("server is at http://localhost:3003");
});