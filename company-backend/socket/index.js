/* -------------------------------------- 聊天功能(请假和公告通知) -------------------------------------------- */
const jwt = require('jsonwebtoken')//jwt(token加密模块)

module.exports = function (io) {
    // 创建授权类型
    var WebSocketType = {
        crewGroupList: 0,//获取在线普工和老总列表
        leaderGroupList: 1,//获取在线经理和老总列表
        GroupChat: 2,//公司群聊
        // departmentGroupChat:3,//部门群聊
        leaderGroupChat: 4,//高层群聊
        SingleChat: 5,//私聊(高层)
        // departmentSingleChat:6,//私聊(部门)
        sendLeaveState: 7,//发送请假状态
        getLeaveState: 8,//接收下级的请假申请
        sendAllStaffNotice: 9,//向对应部门下的员工发送新的公告提醒
        sendBusinessState: 10,//发送请假状态
        getBusinessState: 11,//接收下级的请假申请
    }

    // 监听用户连接到socket服务器
    io.on('connection', (socket, req) => { //io模块固定的消息事件之一,用户加入
        // 相较于ws模块,socket.io模块中接收前端传过来的参数并不是存放在req里面的了
        // 而是存在socket里面
        // console.log('前端传过来的用户token:',socket.handshake.query.token);
        //做权限验证(将token解密)
        try {
            const payload = jwt.verify(socket.handshake.query.token, 'lam')
            // 鉴权成功后第一件事就是发送欢迎词以及获取当前在线的用户1
            if (payload) {//鉴权成功(token能够成功解密出来)
                // console.log('解密token的信息',payload.data);
                //给socket绑定解密的用户名(用于后续显示消息的发送者是谁)
                console.log('连接成功!!', payload.data[0]);
                socket.user = payload.data[0]//保存发送者的名字
                socket.u_id = payload.data[1]//保存发送者的工号id//不能绑定socket的id属性,会出现错误
                socket.department = payload.data[3]//保存发送者的部门
                if (payload.data[2] == 1) socket.type = '普工'//保存发送者的职位
                if (payload.data[2] == 2) socket.type = '经理'//保存发送者的职位
                if (payload.data[2] == 3) socket.type = '老总'//保存发送者的职位
                if (payload.data[2] == 4) socket.type = '管理员'//保存发送者的职位
                //更新在线用户列表
                sendLeader(io)//经理和老总
                sendCrew(io, socket.department)//经理和普工
            }
        } catch (err) {//解密失败verify方法报错
            // 捕获错误信息防止程序崩溃
            console.log(`错误信息${err}!`);
        }

        // 0. 监听获取特定部门的经理和普工在线列表
        socket.on(WebSocketType.crewGroupList, () => {
            //这就是ws模块中的.clients,用于存放所有连接到这台服务器的客户端
            // console.log(io.sockets.sockets);//里面接收的是一个map结构数据,ws模块中是一个set结构数据
            // 将这个map数据转化为数组方便我们后面取值
            console.log('当前在线的同一部门普工', Array.from(io.sockets.sockets).map(item => item[1].user));
        })

        // 1. 监听获取经理和老总列表
        socket.on(WebSocketType.leaderGroupList, (msg) => {
            //这就是ws模块中的.clients,用于存放所有连接到这台服务器的客户端
            // console.log(io.sockets.sockets);//里面接收的是一个map结构数据,ws模块中是一个set结构数据
            // 将这个map数据转化为数组方便我们后面取值
            console.log('有人接入服务器~', msg);
            sendLeader(io)//发送当前在线的经理和老总列表
            // console.log(Array.from(io.sockets.sockets).map(item=>item[1].user));
        })

        // 2. 监听公司总群聊功能(接收客户端发送过来的消息在做全体的转发)
        socket.on(WebSocketType.GroupChat, (msg) => {
            console.log('公司总群聊接到消息', msg);
            if (msg.user.type == 1) msg.user.type = '普工'
            if (msg.user.type == 2) msg.user.type = '经理'
            if (msg.user.type == 3) msg.user.type = '老总'
            if (msg.user.type == 4) msg.user.type = '管理员'
            io.sockets.emit(WebSocketType.GroupChat,//设置为群聊模式
                createMessage(//io模块提供一个.sockets方法可以向所有的客户端进行操作
                    {
                        user: msg.user.username,//发送者的姓名
                        type: msg.user.type,//发送者职位
                        department: msg.user.department,//发送者部门
                        sendTime: getNowTime(),//发送时间
                    },
                    msg//发送的消息
                ))
        })

        // 3. 监听高层群聊功能(只有经理和老总的群)
        socket.on(WebSocketType.leaderGroupChat, (msg) => {
            console.log('高层群聊接到群聊消息', msg);
            if (msg.user.type == 1) msg.user.type = '普工'
            if (msg.user.type == 2) msg.user.type = '经理'
            if (msg.user.type == 3) msg.user.type = '老总'
            io.sockets.emit(WebSocketType.leaderGroupChat,//设置为群聊模式
                createMessage(//io模块提供一个.sockets方法可以向所有的客户端进行操作
                    {
                        user: msg.user.username,//发送者的姓名
                        type: msg.user.type,//发送者职位
                        department: msg.user.department,//发送者部门
                        sendTime: getNowTime(),//发送时间
                    },
                    msg//发送的消息
                ))
        })

        // 4. 监听高层群的私聊功能
        socket.on(WebSocketType.SingleChat, (msg) => {
            console.log('高层群聊接到私聊消息', msg);
            //将获取到的信息数据做一个遍历
            Array.from(io.sockets.sockets).forEach(item => {//对当前在线的用户做一个遍历
                //如果存在前端传过来的私聊对象(给对应的对象和我自己转发消息)
                if (`${item[1].department}(${item[1].type}):${item[1].user}` === msg.to || item[1].u_id === socket.u_id) {
                    //就将消息指定发送给该用户
                    item[1].emit(
                        WebSocketType.SingleChat,//设置为私聊模式
                        createMessage(
                            {
                                user: `${socket.department}(${socket.type}):${socket.user}`,//消息的发送者,本地的token解析出来的信息
                                to: msg.to,//对谁说
                                sendTime: getNowTime(),//发送时间
                            },
                            msg.data//发送的消息
                        )
                    )
                }
            })
        })

        // 5. 监听部门群聊功能(只有经理和给部门下的普工的群)
        socket.on(socket.department, (msg) => {//监听标志位为对应的部门名字
            // console.log('当前的群聊部门为:',socket.department);
            console.log('部门群聊接到消息', msg);
            io.sockets.emit(socket.department,//设置为群聊模式
                createMessage(//io模块提供一个.sockets方法可以向所有的客户端进行操作
                    {
                        user: socket.user,//发送者的姓名
                        type: socket.type,//发送者职位
                        department: socket.department,//发送者部门
                        sendTime: getNowTime(),//发送时间
                    },
                    msg//发送的消息
                ))
        })

        // 6. 监听部门群的私聊功能
        socket.on(socket.department + '私聊', (msg) => {
            // console.log('部门私聊接收到消息',msg,'发送者信息:',socket);
            //将获取到的信息数据做一个遍历
            Array.from(io.sockets.sockets).forEach(item => {//对当前在线的用户做一个遍历
                //如果存在前端传过来的私聊对象(给对应的对象和我自己转发消息)
                if (`${item[1].department}(${item[1].type}):${item[1].user}` === msg.to || item[1].u_id === socket.u_id) {
                    //就将消息指定发送给该用户
                    item[1].emit(
                        socket.department + '私聊',//设置为私聊模式
                        createMessage(
                            {
                                user: `${socket.department}(${socket.type}):${socket.user}`,//消息的发送者,本地的token解析出来的信息
                                to: msg.to,//对谁说
                                sendTime: getNowTime(),//发送时间
                            },
                            msg.data//发送的消息
                        )
                    )
                }
            })
        })

        // 7. 发送请假状态审批完成(经理和老总)
        socket.on(WebSocketType.sendLeaveState, (msg) => {
            console.log('上级收到的请假条数据(已审批):', msg);
            // console.log('当前socket中的信息:',socket);
            //将获取到的信息数据做一个遍历
            Array.from(io.sockets.sockets).forEach(item => {//对当前在线的用户做一个遍历
                if (item[1].u_id === msg.row.u_id) {//如果存在前端传过来的私聊对象
                    //就将消息指定发送给该用户
                    item[1].emit(
                        WebSocketType.sendLeaveState,//设置为请假审批状态发送模式
                        createMessage(
                            {
                                user: `${msg.user.department}(${msg.user.type===2?'经理':'老总'}):${msg.user.username}`,//消息的发送者,本地的token解析出来的信息
                                sendTime: getNowTime(),//发送时间
                            },
                            {
                                state: msg.state,//请假状态
                                id: msg.row.l_id//假条id
                            }
                        )
                    )
                }
                // console.log(Number(item[1].id) === msg.u_id);
                // console.log(item[1].id === msg.row.u_id);
            })
        })

        // 8. 请假申请发送给指定上级
        socket.on(WebSocketType.getLeaveState, (msg) => {
            console.log('上级收到的请假条数据(未审批)', msg);
            // 对接收到的假条数据做判断(根据只为类型,普工则交给对应的部门经理,部门经理则提交给老总)
            if (msg.type === 1) {//普工提交给自己所在的部门经理
                Array.from(io.sockets.sockets).forEach(item => {//对当前在线的用户做一个遍历
                    // 给所在部门的经理发送请假需求
                    if (item[1].department === msg.leaveData.department && item[1].type === '经理') {//如果存在前端传过来的私聊对象
                        //就将消息指定发送给该用户
                        item[1].emit(
                            WebSocketType.getLeaveState,//设置为请假审批状态发送模式
                            createMessage(
                                {
                                    user: `${msg.leaveData.department}(普工):${msg.leaveData.username}`,//消息的发送者,本地的token解析出来的信息
                                    sendTime: getNowTime(),//发送时间
                                },
                                {
                                    msg: '您收到一个普工的请假需求,请及时审批!'
                                }
                            )
                        )
                    }
                })
            } else if (msg.type === 2) {//经理则提交给老总
                console.log('发送给老总!');
                Array.from(io.sockets.sockets).forEach(item => {//对当前在线的用户做一个遍历
                    // 给老总发送请假需求
                    if (item[1].type === '老总') {//如果存在前端传过来的私聊对象
                        //就将消息指定发送给该用户
                        item[1].emit(
                            WebSocketType.getLeaveState,//设置为请假审批状态发送模式
                            createMessage(
                                {
                                    user: `${msg.leaveData.department}(经理):${msg.leaveData.username}`,//消息的发送者,本地的token解析出来的信息
                                    sendTime: getNowTime(),//发送时间
                                },
                                {
                                    msg: '您收到一个部门经理的请假需求,请及时审批!'
                                }
                            )
                        )
                    }
                })
            }
        })

        // 9. 老总给对应部门发送公告提醒(类型公司群聊) 
        socket.on(WebSocketType.sendAllStaffNotice, (msg) => {
            console.log('最新公告提醒(发送给对应的部门):',msg.data.n_department);
            Array.from(io.sockets.sockets).forEach(item => {
                msg.data.n_department.map(item1=>{
                    if(item1.d_name === item[1].department){
                        console.log('发送部门:',item[1].department);
                        io.sockets.emit(WebSocketType.sendAllStaffNotice,//设置为群聊模式
                            createMessage(//io模块提供一个.sockets方法可以向所有的客户端进行操作
                                {
                                    user: msg.user.username,//发送者的姓名
                                    type: '老总',//发送者职位
                                    department: msg.user.department,//发送者部门
                                    sendTime: getNowTime(),//发送时间
                                    toDepartment: item1.d_name,// 发送给对应部门
                                },
                                msg//发送的消息
                        ))
                    }
                })
            })
        })

        // 10. 发送流程状态审批完成(经理 -> 老总) 二级流程
        socket.on(WebSocketType.sendBusinessState, (msg) => {
            console.log('上级收到的请假条数据(已审批):', msg);
            // console.log('当前socket中的信息:',socket);
            //将获取到的信息数据做一个遍历
            Array.from(io.sockets.sockets).forEach(item => {//对当前在线的用户做一个遍历
                if (item[1].u_id === msg.row.u_id) {//如果存在前端传过来的私聊对象
                    //就将消息指定发送给该用户
                    item[1].emit(
                        WebSocketType.sendBusinessState,//设置为请假审批状态发送模式
                        createMessage(
                            {
                                user: `${msg.user.department}(${msg.user.type===2?'经理':'老总'}):${msg.user.username}`,//消息的发送者,本地的token解析出来的信息
                                sendTime: getNowTime(),//发送时间
                            },
                            {
                                state: msg.state,//请假状态
                                id: msg.row.b_id//假条id
                            }
                        )
                    )
                }
                // console.log(Number(item[1].id) === msg.u_id);
                // console.log(item[1].id === msg.row.u_id);
            })
        })

        // 11. 流程申请发送给上级
        socket.on(WebSocketType.getBusinessState, (msg) => {
            console.log('上级收到的流程数据(未审批)..', msg);
            // 对接收到的假条数据做判断(根据只为类型,普工则交给对应的部门经理,部门经理则提交给老总)
            if (msg.type === 1) {//普工提交给自己所在的部门经理
                Array.from(io.sockets.sockets).forEach(item => {//对当前在线的用户做一个遍历
                    // 给所在部门的经理发送请假需求
                    if (msg.FormData.b_user.includes(item[1].department) && item[1].type === '经理') {//如果存在前端传过来的私聊对象
                        //就将消息指定发送给该用户
                        item[1].emit(
                            WebSocketType.getBusinessState,//设置为请假审批状态发送模式
                            createMessage(
                                {
                                    user: `${msg.FormData.b_user}`,//消息的发送者,本地的token解析出来的信息
                                    sendTime: getNowTime(),//发送时间
                                },
                                {
                                    msg: '您收到一个流程申请,请及时审批!'
                                }
                            )
                        )
                    }
                })
            } else if (msg.type === 2) {//经理则提交给老总
                console.log('发送给老总!');
                Array.from(io.sockets.sockets).forEach(item => {//对当前在线的用户做一个遍历
                    // 给老总发送请假需求
                    if (item[1].type === '老总') {//如果存在前端传过来的私聊对象
                        //就将消息指定发送给该用户
                        item[1].emit(
                            WebSocketType.getBusinessState,//设置为请假审批状态发送模式
                            createMessage(
                                {
                                    user: `${msg.FormData.b_user}`,//消息的发送者,本地的token解析出来的信息
                                    sendTime: getNowTime(),//发送时间
                                },
                                {
                                    msg: '您收到一个流程申请,请及时审批!'
                                }
                            )
                        )
                    }
                })
            }
        })

        // 7. 监听用户断联
        socket.on('disconnect', () => {//io模块的固定消息时间之一:用户退出
            console.log('有用户断联了!');
            //一旦有用户断联服务器重新发送当前在线的用户列表
            sendLeader(io)//经理和老总
            sendCrew(io,socket.department)//经理和普工(断联的用户部门传过去)
        })
    });//设置监听事件

    // 创建消息的发送信息(有没有授权,谁发送的,发了什么)
    function createMessage(user, data) {
        // emit方法可以直接传对象,ws模块不能
        return {
            user,//谁发的消息
            data//发的什么消息
        }
    }

    // 发送经理和老总列表
    function sendLeader(io) {
        var leader = []
        Array.from(io.sockets.sockets).map(item => {
            if (item[1].type === '经理' || item[1].type === '老总') {
                leader.push(`${item[1].department}(${item[1].type}):${item[1].user}`)
            }
        }
        )

        console.log('当前在线的经理和老总列表', leader);
        setTimeout(() => {
            // 表示一旦有客户端连接到服务器,就会向所有的客户端发送当前的在线人数(用户列表)
            io.sockets.emit(WebSocketType.leaderGroupList, createMessage(//io模块提供一个.sockets方法可以向所有的客户端进行操作
                {},//不将消息的发送者传过去
                leader,//将获取到的高层列表发送过去
            ))
        }, 500)//延时500ms发送,等待列表的完成设置
    }

    // 发送特定部门经理和普工列表
    function sendCrew(io, department) {
        console.log('当前部门群聊',department);
        var crew = []
        Array.from(io.sockets.sockets).map(item => {
            if (item[1].department === department) {
                crew.push(`${item[1].department}(${item[1].type}):${item[1].user}`)
            }
        })
        console.log('当前同一部门员工列表',crew);
        // 表示一旦有客户端连接到服务器,就会向所有的客户端发送当前的在线人数(用户列表)
        setTimeout(() => {
            io.sockets.emit(department + '员工', createMessage(//io模块提供一个.sockets方法可以向所有的客户端进行操作
                {},//不将消息的发送者传过去
                crew,//将获取到的高层列表发送过去
            ))
        }, 500)
    }

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
}