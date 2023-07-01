/* ----------------------------- 1. 公共接口(23) --------------------------------------- */ 
var express = require('express');
var router = express.Router();// 引入express路由
var fs = require('fs')// 引入fs模块用于删除用户更新头像后的旧头像
const path = require('path')// 路径模块用于删除头像的路径拼接
const promisePool = require('../../DataBase/index.js')//mysql数据库操作模块
const jwt = require('jsonwebtoken')//jwt(token加密模块)
const multer  = require('multer')//引入multer中间件处理文件上传
const upload = multer({ dest: 'public/img/' })//自动创建处理后的文件保存目录,同时可也可以指定拓展名
const storage = multer.memoryStorage()// 使用内存存储模式将数据存储到数据库中
const uploadToMysql = multer({ storage: storage,fileFilter})

// 设置一个方法用于对前端页面上传文件的文件名作中文转码
function fileFilter(req, file, callback) {
    // 解决中文名乱码的问题
    file.originalname = Buffer.from(file.originalname, "latin1").toString(
      "utf8"
    );
    callback(null, true);
} 

// 1. 登录接口(获取登陆信息)
router.post('/login', async (req , res)=>{
    // 查看数据库内的信息是否存在该用户
    var admin = await promisePool.query(
        'select * from crew where username=? and password=? and type=?',
        [req.body.username,req.body.password,req.body.type])
        // console.log(req.body.username,req.body.password,req.body.type);
    // 判断数据库中是否存在该用户(数据库返回的数据的长度)
    if(!admin[0].length){
        res.send({
            status:0,//登陆状态
            msg:'该用户不存在,请重新登录!!'
        })
    }else{
        // 登陆成功生成token
        const token = jwt.sign(
            {data:[admin[0][0].username,admin[0][0].id,admin[0][0].type,admin[0][0].department]},//将用户名(username),工号(id)加密成token,岗位类型,所在部门
            'lam',// 加密密钥为 lam
            {expiresIn: '7d'} // token生效时间为7天
        )

        // console.log(token);
        // 将生成好的token保存到res.header中返回给前端浏览器
        res.header('Authorization' , token)//固定写为Authorization(后面校验也是用这个请求头)
        res.setHeader("Access-Control-Expose-Headers","Authorization");

        // 发送登陆状态
        res.send({
            status:1,//登陆状态为1
            data: admin[0],//用户数据
        })
    }
})

// 2. 获取当前登录用户信息接口
router.get('/getUserInfo', async (req , res)=>{
    // console.log('111'+req.headers.authorization);
    // 验证token
    const token = req.headers.authorization
    const payload = jwt.verify(token,'lam', async function(err, decoded){
        // console.log(err);
        // console.log(decoded.data);
        if(!err){//确认token
            // 确认token后(我的token中加密的就是用户名和id)连接数据库查找该用户的信息并返回回去
            var userinfo = await promisePool.query(
                'select * from crew where username=? and id=?',
                [decoded.data[0],decoded.data[1]]
                )
                // console.log(userinfo);
            res.send({
                userinfo: userinfo[0][0],//发送用户信息发送过去(用户名和id)
                status:200
            })
        }
        else{
            res.send({
                msg:'token验证失败! 登陆过期',
                status:500
            })
        }
    })//解密token
})

// 3. 修改密码接口 
router.post('/upPwd',async (req , res)=>{  
    // 4.使用query方法来操作数据库(里面填的是sql操作语句)
    var password = await promisePool.query(
        `update crew set password=${req.body.password} where id=${req.body.id} `,
        [req.body.password,req.body.id]
        )
    
    // console.log(req.body);//控制台上输出结果
    res.send({
        msg:'修改成功',
        data: password[0]//输出到页面上
    })
})

// 4. 修改头像
router.post('/changeHeader', upload.single('headpic') , async(req , res)=>{
    // console.log('更新头像数据:',req.body,req.file);//输出post请求体上的内容(对应的员工id,旧头像名字和新头像文件数据)
    var headpic = req.file ? `/img/${req.file.filename}`:`/img/default.png`
    if(req.body.oldHeader !== `/img/staff.png` && req.body.oldHeader !== `/img/manager.png` && req.body.oldHeader !== `/img/boss.png` && req.body.oldHeader !== `/img/default.png`){// 默认照片除外
        fs.unlink(path.join(__dirname, `../../public/${req.body.oldHeader}`) , (err)=>{
            if(!err){
                console.log(`文件删除成功!`);
            }
            else{
                console.log(`文件删除失败!! 错误内容为${err}`);
            }
        })//删除旧头像
    }

    // 存数据库将前端传过来的头像数据存到数据库(头像图片的路径)
    var user = await promisePool.query(
        `update crew set headpic=? where id=?`,
        [headpic,req.body.id])//用户名和头像路径存到数据库

    res.send({
        msg:'头像上传成功!',
        data:user[0]
    })
}) 

// 5. 获取所有员工数量以及信息
router.get('/getAllCount',async (req,res)=>{
    var allCount = await promisePool.query('select * from crew')
    // console.log(`全员总数:${allCount[0].length},
    //              全员数据:${allCount[0]}`);//输出公司全员的人数的数据和数量
    res.send({
        msg:'该公司的全员数量获取成功!',
        allCount:allCount[0].length,//返回公司全员的人数
        data: allCount[0]//返回公司全员的人数的数据
    })
})

// 6. 获取今日上班的员工数量以及信息
router.get('/getOndutyCount',async (req,res)=>{
    var ondutyCount = await promisePool.query('select * from crew where onduty=1')
    // console.log(`今日上班总数:${ondutyCount[0].length},
    //              今日上班的人的数据:${ondutyCount[0]}`);//输出今日上班的人数的数据和数量
    res.send({
        msg:'该公司的全员数量获取成功!',
        ondutyCount:ondutyCount[0].length,//返回今日上班的人数
        data: ondutyCount[0]// 返回今日上班人数的数据
    })
})

// 7. 获取今日请假的员工数量以及信息
router.get('/getLeaveCount',async (req,res)=>{
    var leaveCount = await promisePool.query('select * from crew where onduty=0')
    // console.log(`今日请假总数:${leaveCount[0].length},
    //              今日请假的人的数据:${leaveCount[0]}`);//输出今日请假的人数的数据和数量
    res.send({
        msg:'该公司的全员数量获取成功!',
        leaveCount:leaveCount[0].length,//返回今日请假的人数
        data: leaveCount[0]//返回今日请假的人数的数据
    })
})

// 8. 上班
router.post('/onduty',async (req , res)=>{  
    // console.log('上班时间数据:',req.body.onduty_time_stamp);
    // 4.使用query方法来操作数据库(里面填的是sql操作语句)
    var onduty = await promisePool.query(
        `update crew set onduty=1 , onduty_tiem_stamp=${req.body.onduty_time_stamp} where id=${req.body.id}`)
    
    // console.log(onduty[0]);//控制台上输出结果
    res.send({
        msg:'上班打卡成功!开始今天的工作吧!',
        data: onduty[0]//输出到页面上
    })
})

// 9. 请假(老总) && 下班
router.post('/leave',async (req , res)=>{  
    console.log(111,req.body);
    // console.log('下班数据:',((req.body.endTime - req.body.startTime)/(60*60)).toFixed(2));//小时,取后两位小数
    // 4.使用query方法来操作数据库(里面填的是sql操作语句)
    var leave = await promisePool.query(
        `update crew set onduty=0 
        ,today_work_hours=${((req.body.endTime - req.body.startTime)/(60*60)).toFixed(2)} 
        ,month_work_hours=${(Number(req.body.monthTime)+((req.body.endTime - req.body.startTime)/(60*60))).toFixed(2)}
        where id=${req.body.id}`,
        [req.body.id]
        )
    
    // console.log(leave[0]);//控制台上输出结果
    res.send({
        msg:'下班打卡成功! 再见!',
        data: leave[0]//输出到页面上
    })
})

// 10. 获取公告
router.get('/getNotice',async (req,res)=>{
    var notice = await promisePool.query('select * from notice order by n_createtime desc')//按时间的最新来获取
    // console.log(`公告总条数:${notice[0].length},
    //              公告的详细数据:${notice[0]}`);//输出今日请假的人数的数据和数量
    res.send({
        msg:'获取公告成功!',
        notice:notice[0].length,//返回公告的条数
        data: notice[0]//返回公告的数据
    })
})

// 11. 获取当前用户的公告阅读状态
router.post('/getIsReadNotice',async (req , res)=>{  
    // 4.使用query方法来操作数据库(里面填的是sql操作语句)
    console.log('当前用户的id',req.body);
    var getIsReadNotice = await promisePool.query(
        `select * from crew where id=${req.body.id}`,
        [req.body.id]
        )
    
    // console.log(getIsReadNotice[0]);//控制台上输出结果
    res.send({
        msg:'获取当前公告阅读状态成功!',
        data: getIsReadNotice[0]//输出到页面上
    })
})

// 12. 修改指定所有用户的公告阅读状态(修改为已读)
router.post('/updateIsReadNotice',async (req , res)=>{  
    // 4.使用query方法来操作数据库(里面填的是sql操作语句)
    // console.log('公告状态修改',req.body);
    var updateIsReadNotice = await promisePool.query(
        `update crew set isReadNotice=? where id=${req.body.id}`,
        [req.body.state]
        )
    
    console.log(updateIsReadNotice[0]);//控制台上输出结果
    res.send({
        msg:'修改所有用户的公告阅读状态成功!',
        data: updateIsReadNotice[0]//输出到页面上
    })
})

// 13. 获取自己部门下以及公仓的云仓文件(普工和经理)
router.post('/getAllFile',async (req , res)=>{  
    // 4.使用query方法来操作数据库(里面填的是sql操作语句)
    var file = await promisePool.query(
        `select * from storage where f_department=? or f_department=?`,
        [req.body.department,'公仓'])
    // console.log(file[0]);//控制台上输出结果
    // console.log(req.body);//控制台上输出结果
    res.send({
        msg:'获取部门文件数据成功!',
        data: file[0],//返回你部门的普工数据
        status: 1//返回成功新增的状态码
    })
})

// 14. 上传文件(单文件)
router.post('/uploadFile',uploadToMysql.single('file'),async (req , res)=>{  
    // console.log('前端传过来的文件上传者:',req.body);
    // console.log('前端传过来的文件信息:',req.file);
    const filedata = req.file//上传的文件信息
    const msg = req.body//上传者的信息
    const data = {
      f_name: filedata.originalname,//文件名
      f_value: filedata.buffer,//文件数据
      f_department: msg.f_department,//文件所在部门
      uploader: msg.uploader,//上传者
      createtime: getNowTime(),//文件上传时间
    }
    // console.log('整合后的文件数据信息:',data);
    // 4.使用query方法来操作数据库(里面填的是sql操作语句)

    // 首先对数据库中的文件名进行校验(查重)
    var checkfile = await promisePool.query(`select * from storage where f_name=?`,[data.f_name])
    // console.log('判断数据库中是否有给文件名:',checkfile[0].length);
    if(checkfile[0].length){
        res.send({
            msg:'文件上传失败,云仓中已存在同名文件请修改文件名在上传!',
            status: 0//返回成功新增的状态码
        })
    }else{
        var file = await promisePool.query(
            `insert into storage(f_name,f_value,f_department,uploader,createtime) values (?,?,?,?,?)`,
            [
                data.f_name,
                data.f_value,
                data.f_department,
                data.uploader,
                data.createtime,
            ])
        
        // console.log(file[0]);//控制台上输出结果
        res.send({
            msg:'文件上传成功!',
            status: 1//返回成功新增的状态码
        })
    }
})

// 15. 下载文件(云仓)
router.get('/downloadFile',async (req , res)=>{  
    console.log('前端传过来的对应文件id参数',req.query.id);
    const id = Number(req.query.id)//将文件对应的id转化为数值型
    // 4.使用query方法来操作数据库(里面填的是sql操作语句)
    var fileDownload = await promisePool.query(`select * from storage where f_id=${id}`)
    // console.log('所要下载的文件名:',fileDownload[0][0]);
    res.set({//设置下载url的请求头
        'Content-Type': 'application/x-7z-compressed',
        'Accept-Ranges': 'bytes',
        'Content-Disposition': `attachment; filename="${fileDownload[0][0].f_name}"`
      })
      res.send(fileDownload[0][0].f_value)//返回buffer中的二进制数据
})

// 15. 下载文件(公告)
router.get('/downloadFileN',async (req , res)=>{  
    console.log('前端传过来的对应文件公告文件名参数:',req.query.department);
    // const id = Number(req.query.id)//将文件对应的id转化为数值型
    // 4.使用query方法来操作数据库(里面填的是sql操作语句)
    var fileDownload = await promisePool.query(`select * from storage where f_department=?`,[req.query.department])
    // console.log('所要下载的文件名:',fileDownload);
    res.set({//设置下载url的请求头
        'Content-Type': 'application/x-7z-compressed',
        'Accept-Ranges': 'bytes',
        'Content-Disposition': `attachment; filename="${fileDownload[0][0].f_name}"`
    })
    res.send(fileDownload[0][0].f_value)//返回buffer中的二进制数据
})

// 16. 删除文件
router.post('/deleteFile',async (req , res)=>{  
    // 4.使用query方法来操作数据库(里面填的是sql操作语句)
    var file = await promisePool.query(
        `delete from  storage where f_id=?`,
        [req.body.id])
    // console.log(file[0]);//控制台上输出结果
    // console.log(req.body);//控制台上输出结果
    res.send({
        msg:'删除文件数据成功!',
        data: file[0],//返回你部门的普工数据
        status: 1//返回成功新增的状态码
    })
})

// 17. 删除文件(公告文件或业务文件)
router.post('/deleteFileOther',async (req , res)=>{  
    // console.log('要删除的其他文件',req.body);
    // 4.使用query方法来操作数据库(里面填的是sql操作语句)
    var file = await promisePool.query(
        `delete from  storage where f_department=?`,
        [req.body.department])
    // console.log(file[0]);//控制台上输出结果
    // console.log(req.body);//控制台上输出结果
    res.send({
        msg:'删除文件数据成功!',
        // data: file[0],//返回你部门的普工数据
        status: 1//返回成功新增的状态码
    })
})

// 17. 普工和经理查看自己的请假条列表
router.post('/checkLeave',async (req , res)=>{  
    // 4.使用query方法来操作数据库(里面填的是sql操作语句)
    var Leaves = await promisePool.query(
        `select * from crewleave where u_id=?`,
        [req.body.id])
    // console.log(Leaves[0]);//控制台上输出结果
    // console.log(req.body);//控制台上输出结果
    res.send({
        msg:'获取假条数据成功!',
        data: Leaves[0],//返回你部门的普工数据
        status: 1//返回成功新增的状态码
    })
})

// 18. 新增业务流程
router.post('/createBusiness',async (req , res)=>{  
    console.log('新增业务流程数据:',req.body);
    var departments=''
    req.body.department.map(item=>{
        departments = departments+`[${item.department}]`
    })
    console.log(111,departments);
    // 4.使用query方法来操作数据库(里面填的是sql操作语句)
    try {
        var createNotice = await promisePool.query(
            `insert into business(u_id,b_title,b_createtime,b_desc,b_user,b_approver,b_state,b_file) values (?,?,?,?,?,?,?,?)`,
            [
                req.body.id,
                req.body.title,
                req.body.createtime,
                req.body.desc,
                req.body.user,
                departments,
                0,
                req.body.file,
                req.body.user,
            ])
        
        console.log(createNotice[0]);//控制台上输出结果
        res.send({
            msg:'新增业务流程成功',
            status: 1//返回成功状态码
        })
    } catch (error) {
        res.send({
            msg:'该业务流程已存在,请重试!',
            status: 0//返回失败状态码
        })
    }
})

// 19. 获取自己的业务流程(经理和普工)
router.post('/checkBusiness',async (req , res)=>{  
    // 4.使用query方法来操作数据库(里面填的是sql操作语句)
    var Leaves = await promisePool.query(
        `select * from business where u_id=?`,
        [req.body.id])
    // console.log(Leaves[0]);//控制台上输出结果
    // console.log(req.body);//控制台上输出结果
    res.send({
        msg:'获取流程数据成功!',
        data: Leaves[0],//返回你部门的普工数据
        status: 1//返回成功新增的状态码
    })
})

// 20. 删除自己的业务流程
router.post('/deleteBusiness',async (req , res)=>{  
    // 4.使用query方法来操作数据库(里面填的是sql操作语句)
    var file = await promisePool.query(
        `delete from  business where b_id=?`,
        [req.body.id])
    // console.log(file[0]);//控制台上输出结果
    // console.log(req.body);//控制台上输出结果
    res.send({
        msg:'删除成功!',
        data: file[0],//返回你部门的普工数据
        status: 1//返回成功新增的状态码
    })
})

// 21. 获取下级的流程申请(经理,老总)
router.post('/getAllBusiness',async (req , res)=>{  
    // 4.使用query方法来操作数据库(里面填的是sql操作语句)
    var file = await promisePool.query(
        'select * from business'
        )
    // console.log('所有的流程数据',file[0],req.body.department);//控制台上输出结果 split
    var newList = []
    file[0].forEach(i=>{
        if(i.b_approver.includes(req.body.department)){
            // console.log('符合条件:',i);
            newList.push(i)
        }        
    })
    // // console.log(req.body);//控制台上输出结果
    res.send({
        msg:'获取成功!',
        data: newList,//返回你部门的普工数据
        status: 1//返回成功新增的状态码
    })
})

// 22. 同意或拒绝流程申请(经理,老总)
router.post('/updataBusiness',async (req , res)=>{  
    // console.log('流程修改',req.body);
    // 4.使用query方法来操作数据库(里面填的是sql操作语句)
    var uploadBusiness = await promisePool.query(
        `select  * from business where b_id=?`,[req.body.b_id,])

    // var updataManagerLeave = await promisePool.query(
    //     `update business set state=? , approver=? where type=2 and b_id=?`,
    //     [
    //         req.body.state,
    //         req.body.approver,
    //         req.body.b_id,
    //     ])
    
    // console.log('成功获取到对应的流程数据:',uploadBusiness[0][0]);//控制台上输出结果
    var newList3 = []
    var newList = uploadBusiness[0][0].b_approver.split(']')
    var newList1 = newList.join('')
    var newList2 = newList1.split('[')
    // console.log('解构后的数组:',newList2);
    newList2.forEach(i=>{
        if(i!==''){// 清除空数组(获取完整的流程审批人部门数据)
            newList3.push(i)
        }
    })
    // console.log('解构完成的最终数据:',newList3);// 解构完成的最终数据: [ '工程部', '董事会' ]
    if(newList3.length>1){
        var newList4 = []
        console.log('当前流程为两级流程!');
        newList3.forEach((i,k)=>{
            // 首先判断当前是否已经有人同意了或者拒绝了
            if(uploadBusiness[0][0].b_approver.includes('已同意')){
                console.log('二审!');
                if(req.body.b_approver.includes(i)){
                    console.log('审批人是:',i);
                    newList3.splice(k,1,`${req.body.b_approver}${req.body.state===2?`:已同意`:`:已拒绝`}`)
                    var approver = ''
                    newList3.forEach(i=>{
                        approver = approver+`[${i}]`
                    })
                    var updataManagerLeave2 = promisePool.query(
                        `update business set b_state=? , b_approver=? where b_id=?`,
                        [
                            req.body.state,
                            approver,
                            req.body.b_id,
                        ])
                }
            }else{
                console.log('一审!');
                if(req.body.b_approver.includes(i)){
                    console.log('审批人是:',i);
                    newList3.splice(k,1,`${req.body.b_approver}${req.body.state===2?`:已同意`:`:已拒绝`}`)
                    var approver = ''
                    newList3.forEach(i=>{
                        approver = approver+`[${i}]`
                    })
                    console.log('最终:',approver);
                    var updataManagerLeave1 = promisePool.query(
                        `update business set b_state=? , b_approver=? where b_id=?`,
                        [
                            req.body.state===2?0:1,
                            approver,
                            req.body.b_id,
                        ])
                }
            }
        })
        // console.log('修改数据后:',newList3);
    }else{
        console.log('当前流程为一级流程!');
        var updataManagerLeave = await promisePool.query(
        `update business set b_state=? , b_approver=? where b_id=?`,
        [
            req.body.state,
            `${req.body.b_approver}${req.body.state===2?`:已同意`:`:已拒绝`}`,
            req.body.b_id,
        ])
    }
    // console.log(updataManagerLeave[0]);//控制台上输出结果
    // console.log(req.body);//控制台上输出结果
    res.send({
        msg:'修改经理请假数据成功',
        status: 1//返回成功新增的状态码
    })
})

//获取最新的时间(消息)
function getNowTime() {
    var date = new Date();
    var sign2 = ":";
    var year = date.getFullYear() // 年
    var month = date.getMonth() + 1; // 月
    var day = date.getDate(); // 日
    var hour = date.getHours(); // 时
    var minutes = date.getMinutes(); // 分
    var seconds = date.getSeconds() //秒
    // 给一位数的数据前面加 “0”
    if (month >= 1 && month <= 9) {
        month = "0" + month;
    }
    if (day >= 0 && day <= 9) {
        day = "0" + day;
    }
    if (hour >= 0 && hour <= 9) {
      hour = "0" + hour;
      }
    if (minutes >= 0 && minutes <= 9) {
      minutes = "0" + minutes;
    }
    if (seconds >= 0 && seconds <= 9) {
      seconds = "0" + seconds;
  }
    return year + "-" + month + "-" + day + " " + hour + sign2 + minutes
}

module.exports = router;// 将路由暴露出去
