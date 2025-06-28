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

const Payment = require('wxpay-v3');

const app = new Koa();
const router = new Router();

const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root",
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
  // const login_uuid = ctx.request.headers.token;
  // const { user_uuid: user_uuid_from_params } = ctx.request.params;
  const { user_uuid: user_uuid_from_params } = ctx.request.query;
  console.log('ctx.request.params', ctx.request.params.user_uuid)
  console.log('user_uuid_from_params', user_uuid_from_params)
  if (!login_uuid) {
    ctx.body = resInfo.userNotLogin();
    return ;
  }
  // const { user_uuid } = ctx.request.params;
  // 注意：此处是query，而在axios中是params
  // const { user_uuid } = ctx.request.query;

  const loginResult = await mysqlQuery(`select * from login where uuid = "${encodeSqlParams(login_uuid)}" limit 1;`);
  const { user_uuid } = loginResult.data[0] || {}
  console.log('note/list user_uuid', user_uuid)
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
  const loginResultRole = await mysqlQuery(`select * from user where uuid = "${encodeSqlParams(user_uuid)}";`);
  const { role } = loginResultRole.data[0] || {}
  console.log('role', role)
  if (role === 1) {
    const result = await mysqlQuery(`select * from note where user_uuid = '${encodeSqlParams(user_uuid_from_params)}' and is_delete = 0 order by id desc`);
    console.log("result", result)
    ctx.body = JSON.stringify(result, null, 2);
    return ;
    // ctx.body = resInfo.userNotLogin();
    // return ;
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
  // const login_uuid = ctx.request.headers.token;
  // const { user_uuid: user_uuid_from_body } = ctx.request.params;
  const { user_uuid: user_uuid_from_body } = ctx.request.body;
  console.log('ctx.request.params', ctx.request.params.user_uuid)
  console.log('user_uuid_from_body', user_uuid_from_body)
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
  const loginResultRole = await mysqlQuery(`select * from user where uuid = "${encodeSqlParams(user_uuid)}";`);
  const { role } = loginResultRole.data[0] || {}
  console.log('role', role)
  if (role === 1) {
    // const result = await mysqlQuery(`select * from note where user_uuid = '${encodeSqlParams(user_uuid_from_body)}' and is_delete = 0 order by id desc`);
  const result = await mysqlQuery(`insert into note ( uuid, user_uuid, content ) values ( "${encodeSqlParams(uuid)}", "${encodeSqlParams(user_uuid_from_body)}", "${encodeSqlParams(content)}" );`);
    console.log("result", result)
    ctx.body = JSON.stringify(result, null, 2);
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
  // const login_uuid = ctx.request.headers.token;
  // const { user_uuid: user_uuid_from_params } = ctx.request.params;
  const { user_uuid: user_uuid_from_body } = ctx.request.body;
  console.log('ctx.request.params', ctx.request.params.user_uuid)
  console.log('user_uuid_from_body', user_uuid_from_body)
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
  const loginResultRole = await mysqlQuery(`select * from user where uuid = "${encodeSqlParams(user_uuid)}";`);
  const { role } = loginResultRole.data[0] || {}
  console.log('role', role)
  if (role === 1) {
    // const result = await mysqlQuery(`select * from note where user_uuid = '${encodeSqlParams(user_uuid_from_body)}' and is_delete = 0 order by id desc`);
  // const result = await mysqlQuery(`insert into note ( uuid, user_uuid, content ) values ( "${encodeSqlParams(uuid)}", "${encodeSqlParams(user_uuid_from_body)}", "${encodeSqlParams(content)}" );`);
  const result = await mysqlQuery(`update note set is_delete = 1 where user_uuid = "${encodeSqlParams(user_uuid_from_body)}" and  uuid = "${encodeSqlParams(noteUuid)}";`);
    console.log("result", result)
    ctx.body = JSON.stringify(result, null, 2);
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
  // const login_uuid = ctx.request.headers.token;
  // const { user_uuid: user_uuid_from_params } = ctx.request.params;
  const { user_uuid: user_uuid_from_body } = ctx.request.body;
  console.log('ctx.request.params', ctx.request.params.user_uuid)
  console.log('user_uuid_from_body', user_uuid_from_body)
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
  const loginResultRole = await mysqlQuery(`select * from user where uuid = "${encodeSqlParams(user_uuid)}";`);
  const { role } = loginResultRole.data[0] || {}
  console.log('role', role)
  if (role === 1) {
    // const result = await mysqlQuery(`select * from note where user_uuid = '${encodeSqlParams(user_uuid_from_body)}' and is_delete = 0 order by id desc`);
  // const result = await mysqlQuery(`insert into note ( uuid, user_uuid, content ) values ( "${encodeSqlParams(uuid)}", "${encodeSqlParams(user_uuid_from_body)}", "${encodeSqlParams(content)}" );`);
  // const result = await mysqlQuery(`update note set is_delete = 1 where user_uuid = "${encodeSqlParams(user_uuid_from_body)}" and  uuid = "${encodeSqlParams(noteUuid)}";`);
  const result = await mysqlQuery(`update note set content = "${encodeSqlParams(content)}" where user_uuid = "${encodeSqlParams(user_uuid_from_body)}" and uuid = "${encodeSqlParams(noteUuid)}";`);
    console.log("result", result)
    ctx.body = JSON.stringify(result, null, 2);
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
  // // const login_uuid = ctx.request.headers.token;
  // // const { user_uuid: user_uuid_from_body } = ctx.request.params;
  // const { user_uuid: user_uuid_from_body } = ctx.request.body;
  // console.log('ctx.request.params', ctx.request.params.user_uuid)
  // console.log('user_uuid_from_body', user_uuid_from_body)
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
  const checkIsUserExists = await mysqlQuery(`select * from user where name = "${encodeSqlParams(name)}" and is_delete = 0 and role = 2;`);
  if (checkIsUserExists.data.length) {
    ctx.body = resInfo.userAlreadyExists();
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
  const loginResultRole = await mysqlQuery(`select * from user where uuid = "${encodeSqlParams(user_uuid)}";`);
  const { role } = loginResultRole.data[0] || {}
  console.log('role', role)
  if (role === 1) {
    // const result = await mysqlQuery(`select * from note where user_uuid = '${encodeSqlParams(user_uuid_from_body)}' and is_delete = 0 order by id desc`);
  // const result = await mysqlQuery(`insert into note ( uuid, user_uuid, content ) values ( "${encodeSqlParams(uuid)}", "${encodeSqlParams(user_uuid_from_body)}", "${encodeSqlParams(content)}" );`);
  // const result = await mysqlQuery(`update note set is_delete = 1 where user_uuid = "${encodeSqlParams(user_uuid_from_body)}" and  uuid = "${encodeSqlParams(noteUuid)}";`);
  // const result = await mysqlQuery(`update user set is_delete = 1 where uuid = "${encodeSqlParams(user_uuid_from_body)}";`);
  const result = await mysqlQuery(`insert into user ( uuid, name, pass ) values ( "${encodeSqlParams(uuid)}", "${encodeSqlParams(name)}", "${encodeSqlParams(pass)}"  );`);
    console.log("result", result)
    ctx.body = JSON.stringify(result, null, 2);
    return ;
  }
  const result = await mysqlQuery(`insert into user ( uuid, name, pass ) values ( "${encodeSqlParams(uuid)}", "${encodeSqlParams(name)}", "${encodeSqlParams(pass)}"  );`);
  console.log("result", result)
  ctx.body = JSON.stringify(result, null, 2);
  // ctx.body = resInfo.userNotLogin();
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
  // const login_uuid = ctx.request.headers.token;
  // const { user_uuid: user_uuid_from_body } = ctx.request.params;
  const { uuid: uuid_from_body } = ctx.request.body;
  console.log('ctx.request.params', ctx.request.params.uuid)
  console.log('uuid_from_body', uuid_from_body)
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
  const loginResultRole = await mysqlQuery(`select * from user where uuid = "${encodeSqlParams(user_uuid)}";`);
  const { role } = loginResultRole.data[0] || {}
  console.log('role', role)
  if (role === 1) {
    // const result = await mysqlQuery(`select * from note where user_uuid = '${encodeSqlParams(user_uuid_from_body)}' and is_delete = 0 order by id desc`);
  // const result = await mysqlQuery(`insert into note ( uuid, user_uuid, content ) values ( "${encodeSqlParams(uuid)}", "${encodeSqlParams(user_uuid_from_body)}", "${encodeSqlParams(content)}" );`);
  // const result = await mysqlQuery(`update note set is_delete = 1 where user_uuid = "${encodeSqlParams(user_uuid_from_body)}" and  uuid = "${encodeSqlParams(noteUuid)}";`);
  const result = await mysqlQuery(`update user set is_delete = 1 where uuid = "${encodeSqlParams(uuid_from_body)}";`);
    console.log("result", result)
    ctx.body = JSON.stringify(result, null, 2);
    return ;
  }
  // const result = await mysqlQuery(`update user set is_delete = 1 where uuid = "${encodeSqlParams(user_uuid)}";`);
  // console.log("result", result)
  // ctx.body = JSON.stringify(result, null, 2);
  // ctx.body = JSON.stringify({ status: -1, data: {}, msg: '用户未登录' }, null, 2);
  ctx.body = resInfo.userNotLogin();
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
  // const login_uuid = ctx.request.headers.token;
  // const { user_uuid: user_uuid_from_body } = ctx.request.params;
  const { uuid: uuid_from_body } = ctx.request.body;
  console.log('ctx.request.params', ctx.request.params.uuid)
  console.log('uuid_from_body', uuid_from_body)
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
  if (!uuid_from_body) {
    ctx.body = resInfo.ziduanCannotEmpty('uuid');
    return ;
  }
  // const prevPassResult = await mysqlQuery(`select * from user where uuid = "${encodeSqlParams(user_uuid)}" and pass = "${encodeSqlParams(pass)}"`);
  const prevPassResult = await mysqlQuery(`select * from login where uuid = "${encodeSqlParams(login_uuid)}"`);
  if (!(prevPassResult.data.length)) {
    ctx.body = { status: -1, data: '', msg: 'token无效' }
    return ;
  }
  const loginResultRole = await mysqlQuery(`select * from user where uuid = "${encodeSqlParams(user_uuid)}";`);
  const { role } = loginResultRole.data[0] || {}
  console.log('role', role)
  if (role === 1) {
    // const result = await mysqlQuery(`select * from note where user_uuid = '${encodeSqlParams(user_uuid_from_body)}' and is_delete = 0 order by id desc`);
  // const result = await mysqlQuery(`insert into note ( uuid, user_uuid, content ) values ( "${encodeSqlParams(uuid)}", "${encodeSqlParams(user_uuid_from_body)}", "${encodeSqlParams(content)}" );`);
  // const result = await mysqlQuery(`update note set is_delete = 1 where user_uuid = "${encodeSqlParams(user_uuid_from_body)}" and  uuid = "${encodeSqlParams(noteUuid)}";`);
  // const result = await mysqlQuery(`update user set is_delete = 1 where uuid = "${encodeSqlParams(user_uuid_from_body)}";`);
  const result = await mysqlQuery(`update user set pass = "${encodeSqlParams(pass)}" where uuid = "${encodeSqlParams(uuid_from_body)}";`);
    console.log("result", result)
    ctx.body = JSON.stringify(result, null, 2);
    return ;
  }
  // const result = await mysqlQuery(`update user set pass = "${encodeSqlParams(pass)}" where uuid = "${encodeSqlParams(user_uuid)}";`);
  // console.log("result", result)
  // ctx.body = JSON.stringify(result, null, 2);
  ctx.body = resInfo.userNotLogin();
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
  // // const login_uuid = ctx.request.headers.token;
  // // const { user_uuid: user_uuid_from_body } = ctx.request.params;
  // const { user_uuid: user_uuid_from_body } = ctx.request.body;
  // console.log('ctx.request.params', ctx.request.params.user_uuid)
  // console.log('user_uuid_from_body', user_uuid_from_body)
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

  const loginResultRole = await mysqlQuery(`select * from user where uuid = "${encodeSqlParams(user_uuid)}";`);
  const { role } = loginResultRole.data[0] || {}
  console.log('role', role)
  if (role === 1) {
    // const result = await mysqlQuery(`select * from note where user_uuid = '${encodeSqlParams(user_uuid_from_body)}' and is_delete = 0 order by id desc`);
    // const result = await mysqlQuery(`insert into note ( uuid, user_uuid, content ) values ( "${encodeSqlParams(uuid)}", "${encodeSqlParams(user_uuid_from_body)}", "${encodeSqlParams(content)}" );`);
    // const result = await mysqlQuery(`update note set is_delete = 1 where user_uuid = "${encodeSqlParams(user_uuid_from_body)}" and  uuid = "${encodeSqlParams(noteUuid)}";`);
    // const result = await mysqlQuery(`update user set is_delete = 1 where uuid = "${encodeSqlParams(user_uuid_from_body)}";`);
    // const result = await mysqlQuery(`update user set pass = "${encodeSqlParams(pass)}" where uuid = "${encodeSqlParams(user_uuid_from_body)}";`);
    const result = await mysqlQuery(`select * from user where is_delete = 0 and role = 2 order by id desc;`);
    console.log("result", result)
    ctx.body = JSON.stringify(result, null, 2);
    return ;
  }
  // const result = await mysqlQuery(`select * from user;`);
  // console.log("result", result)
  // ctx.body = JSON.stringify(result, null, 2);
  // ctx.body = JSON.stringify({ status: -1, data: {}, msg: '用户未登录' }, null, 2);
  ctx.body = resInfo.userNotLogin();
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
  const checkLogin = await mysqlQuery(`select * from user where name = "${encodeSqlParams(name)}" and pass = "${encodeSqlParams(pass)}" and role = 2`);
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

router.post('/api/user/login/admin', async (ctx, next) => {
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
  const checkLogin = await mysqlQuery(`select * from user where role = 1 and name = "${encodeSqlParams(name)}" and pass = "${encodeSqlParams(pass)}"`);
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
  const loginResultRole = await mysqlQuery(`select * from user where uuid = "${user_uuid}";`);
  const { role } = loginResultRole.data[0] || {}
  // if (!user_uuid) {
  //   ctx.body = JSON.stringify({
  //     status: -1,
  //     data: [],
  //     msg: '用户未登录'
  //   }, null, 2);
  //   return ;
  // }
  if (!role) {
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

router.post('/api/pay/add', async (ctx, next) => {
  // console.log("uuidV4", uuidv4())
  const uuid = uuidv4();
  console.log('body', ctx.request.body);
  const login_uuid = ctx.request.headers.token;
  // const login_uuid = ctx.request.headers.token;
  // const { user_uuid: user_uuid_from_body } = ctx.request.params;
  const { user_uuid: user_uuid_from_body } = ctx.request.body;
  const { desc, amount } = ctx.request.body;
  console.log('ctx.request.params', ctx.request.params.user_uuid)
  console.log('user_uuid_from_body', user_uuid_from_body)
  if (!login_uuid) {
    ctx.body = resInfo.userNotLogin();
    return ;
  }
  const { content } = ctx.request.body;
  if (!desc) {
    ctx.body = resInfo.ziduanCannotEmpty('desc');
    return ;
  }

  if (!amount) {
    ctx.body = resInfo.ziduanCannotEmpty('amount');
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
  const loginResultRole = await mysqlQuery(`select * from user where uuid = "${encodeSqlParams(user_uuid)}";`);
  const { role } = loginResultRole.data[0] || {}
  console.log('role', role)
  if (role === 1) {
    // const result = await mysqlQuery(`select * from note where user_uuid = '${encodeSqlParams(user_uuid_from_body)}' and is_delete = 0 order by id desc`);
  const result = await mysqlQuery(`insert into note ( uuid, user_uuid, content ) values ( "${encodeSqlParams(uuid)}", "${encodeSqlParams(user_uuid_from_body)}", "${encodeSqlParams(content)}" );`);
    console.log("result", result)
    ctx.body = JSON.stringify(result, null, 2);
    return ;
  }
  const result = await mysqlQuery(`insert into note ( uuid, user_uuid, content ) values ( "${encodeSqlParams(uuid)}", "${encodeSqlParams(user_uuid)}", "${encodeSqlParams(content)}" );`);


  const payment = new Payment({
      appid: 'wxdb000329f81e984e',
      mchid: '1626740994',
      private_key: require('fs').readFileSync('./cert/apiclient_key.pem').toString(),//或者直接复制证书文件内容
      serial_no:'673D69E34F364639A3AD47D1B61DC06D0FA51C76',
      apiv3_private_key:'sdfgdrdfvcxdffvcdedsdfredfdcxfde',
      notify_url: 'https://shopping.gongsikai.com',
  })

  console.log('payment', payment);

  // const run = async () => {
  let resultPay = await payment.native({
    description: desc,
    out_trade_no:Date.now().toString(),
    amount:{
        total: +amount
    }
  })
  // console.log(result)
  console.log(resultPay)
  // }

  // run()

  console.log("result", result)
  // ctx.body = JSON.stringify(result, null, 2);
  ctx.body = JSON.stringify({ status: 0, data: JSON.parse(resultPay.data || "{}"), msg: '' }, null, 2);
});


const ipEndpointRequestMap = new Map(); // 使用Map存储IP和端点的请求记录

const rateLimitMiddleware = async (ctx, next) => {
  // 跳过OPTIONS请求的速率限制
  if (ctx.method === 'OPTIONS') {
    return await next();
  }

  const clientIp = ctx.ip;
  const endpoint = ctx.path; // 获取请求的路径
  const currentTime = Date.now();
  
  // 为IP和端点组合创建一个唯一键
  const key = `${clientIp}-${endpoint}`;

  // 检查是否存在该IP和端点的请求记录
  if (ipEndpointRequestMap.has(key)) {
    const lastRequestTime = ipEndpointRequestMap.get(key);
    // 计算两次请求的时间间隔
    const timeDifference = currentTime - lastRequestTime;
    
    // 如果时间间隔小于5秒(5000毫秒)，返回限制响应
    if (timeDifference < 5000) {
      ctx.status = 429; // 状态码429表示请求过多
      ctx.body = {
        code: 429,
        message: '请求过于频繁，请稍后再试',
        data: null
      };
      return;
    }
  }

  // 更新该IP和端点的最后请求时间
  ipEndpointRequestMap.set(key, currentTime);

  // 清理过期的记录
  for (const [storedKey, time] of ipEndpointRequestMap.entries()) {
    if (currentTime - time >= 5000) {
      ipEndpointRequestMap.delete(storedKey);
    }
  }

  // 继续处理请求
  await next();
};

app.use(rateLimitMiddleware)
  .use(koaBody())
  .use(cors())
  .use(router.routes())
  .use(router.allowedMethods());

app.listen(3003, () => {
  console.log("server is at http://localhost:3003");
});