cc.Class({
    extends: cc.Component,

    properties: {

        player2Prefab: {
            default: null,
            type: cc.Prefab
        },
        player1Prefab: {
            default: null,
            type: cc.Prefab
        },
        myAction: {
            default: null
        },
        balls: {
            default: [],
            type: [cc.Node] // 用 type 指定数组的每个元素都是字符串类型
        },
        label: {
            default: null,
            type: cc.Label
        },
        foceBar: {
            default: null,
            type: cc.ProgressBar
        },
       
       
      
        Score: 0,
        mouseJoint: true,
        initPositon: 0




    },



    //很多变量都在此初始化，并不都是在 properties 中
    onLoad: function () {
        //开启碰撞组件
        cc.director.getCollisionManager().enabled = true
        cc.director.getCollisionManager().enabledDebugDraw = true
        cc.director.getPhysicsManager().enabled = true


        //错误示例：这样是无法获取 graphics 节点的。
        // let g = this.getComponent(cc.Graphics) 
        //正确示例：
        let graphicsNode = this.node.getChildByName("graphics")
        let graphics = graphicsNode.getComponent(cc.Graphics)




        //画得分区 
        graphics.fillColor = cc.Color.BLUE
        graphics.circle(0, 1000, 160)
        graphics.fill()
        graphics.fillColor = cc.Color.WHITE
        graphics.circle(0, 1000, 120)
        graphics.fill()
        graphics.fillColor = cc.Color.RED
        graphics.circle(0, 1000, 60)
        graphics.fill()
        graphics.fillColor = cc.Color.WHITE
        graphics.circle(0, 1000, 20)
        graphics.fill()

        //生成对手的球和我方球
        this.createNewBall()
        this.createplayer()

        //开启摄像机
        let cameraNode = this.node.getChildByName("camera")
        this.camera = cameraNode.getComponent(cc.Camera)
        this.camera.enabled = false
 
        cc.director.getPhysicsManager().attachDebugDrawToCamera(this.camera);
        cc.director.getCollisionManager().attachDebugDrawToCamera(this.camera);
       
 


        this.foceBar.progress = 0
        this.speed = 1

        //用来判断是否是初始局。如果没有这个变量，加上初始局所有球都是静止，那么会不断重置游戏信息。
        this.canReset = false

        //是否蓄力
        this.isFoce = false
        //控制蓄力条的变换
        this._pingpong = false

        //控制是否是人玩
        this.isComputer = true


        this.tLNode = this.node.getChildByName("turnLeft")
        this.tRNode = this.node.getChildByName("turnRight")
        this.foceNode = this.node.getChildByName("foce")
        //点击事件注册
        this.onEable()

        //控制电脑玩家出现逻辑。
        //这里比较绕。最好的理解方式是假设游戏开始的情况开始分析。如何不能理解那。。。
        this.computerDelayFinished = true



    },

    //重置游戏状态
    resetGame: function () {
        this.foceBar.progress = 0
        this.camera.node.position = cc.Vec2.ZERO

        if (this.isComputer) {

            if (!this.computerDelayFinished)
                return

            this.ComputerPLay()

        } else {
            this.canReset = false
            this.isComputer = true

            this.createplayer()
            this.onEable()

        }

    },
    ComputerPLay: function () {
        this.computerDelayFinished = false

        let newBall = cc.instantiate(this.player2Prefab)

        this.node.addChild(newBall)
        newBall.setPosition(cc.p(0, this.initPositon))

        this.balls.push(newBall)
        this.player = newBall

        this.scheduleOnce(function () {
            // 这里的 this 指向 component
            let X = Math.floor(-50 + Math.random() * (50 - (-50)))
            var actionBy = cc.moveTo(2, cc.p(X, this.initPositon))
            this.player.runAction(actionBy)
        }, 1);


        let rigidBody = this.player.getComponent(cc.RigidBody)

        this.scheduleOnce(function () {
            // 这里的 this 指向 component

            let Y = Math.floor(950 + Math.random() * (1200 - (-950)));
            rigidBody.linearVelocity = cc.p(0, Y)

            this.isComputer = false
            this.canReset = true
            this.computerDelayFinished = true
        }, 4);


    },

    //判断场中所有小球是否静止
    isBallStatic: function () {
        let isStatic = true
        this.balls.forEach(function (item, index, array) {
            let rigidBody = item.getComponent(cc.RigidBody)
            if (!rigidBody.linearVelocity.equals(cc.v2(0, 0))) {
                isStatic = false
            }
        })
        return isStatic

    },

    canFoce: function () {
        this.isFoce = true
    },

    sendBall: function () {
        this.onDisable()
        this.isFoce = false

        let rigidBody = this.player.getComponent(cc.RigidBody)
        rigidBody.linearVelocity = cc.p(0, this.foceBar.progress * 2000)

        this.canReset = true

    },

    onEable: function () {

        this.foceNode.on(cc.Node.EventType.TOUCH_START, this.canFoce, this)
        this.foceNode.on(cc.Node.EventType.TOUCH_END, this.sendBall, this)
        this.tLNode.on('click', this.moveLeft, this)
        this.tRNode.on('click', this.moveRight, this)
    },

    onDisable: function () {
        this.foceNode.off(cc.Node.EventType.TOUCH_START, this.canFoce, this)
        this.foceNode.off(cc.Node.EventType.TOUCH_END, this.sendBall, this)
        this.tLNode.off('click', this.moveLeft, this)
        this.tRNode.off('click', this.moveRight, this)
    },

    //蓄力条变换
    foce: function (dt) {

        let progress = this.foceBar.progress
        if (progress < 1.0 && this._pingpong) {
            progress += dt * this.speed
        } else {
            progress -= dt * this.speed
            this._pingpong = progress <= 0
        }
        this.foceBar.progress = progress
    },

    moveLeft: function () {
        this.player.x = this.player.x - 10

    },
    moveRight: function () {
        this.player.x = this.player.x + 10
    },

    //生成发出球
    createplayer: function () {
        let newBall = cc.instantiate(this.player1Prefab)
        // 将新增的节点添加到 Canvas 节点下面
        this.node.addChild(newBall)
        // 为星星设置一个随机位置
        newBall.setPosition(cc.p(0, this.initPositon))
        this.balls.push(newBall)
        this.player = newBall


    },

    createNewBall: function () {
        for (let i = 0; i < 2; i++) {
            // 使用给定的模板在场景中生成一个新节点
            let newBall = cc.instantiate(this.player2Prefab)
            // 将新增的节点添加到 Canvas 节点下面
            this.node.addChild(newBall)
            // 为星星设置一个随机位置
            newBall.setPosition(this.getNewStarPosition())
            this.balls.push(newBall)
        }

        for (let i = 0; i < 2; i++) {
            // 使用给定的模板在场景中生成一个新节点
            let newBall = cc.instantiate(this.player1Prefab)
            // 将新增的节点添加到 Canvas 节点下面
            this.node.addChild(newBall)
            // 为星星设置一个随机位置
            newBall.setPosition(this.getNewStarPosition())
            this.balls.push(newBall)
        }

    },


    getNewStarPosition: function () {
        //矩形范围应该在 x轴：-160 ~ 160 y轴：20 ~ 300。

        let randX = Math.floor(-160 + Math.random() * (160 - (-160)))
 
        let randY = Math.floor(940 + Math.random() * (1180 - 940))
    

        // 返回星星坐标
        return cc.p(randX, randY)
    },

    //判断并计算分数
    countScore: function () {
        let nearestPLayer = null
        let nearestDistance = 9999
        let that = this
        this.balls.forEach(function (item, index, array) {
            let tempDistance = parseInt(Math.sqrt((item.x * item.x) + (item.y - 140) * (item.y - 140)))
            if (index === 0) {
                nearestDistance = tempDistance
            }

            if (tempDistance < nearestDistance) {
                nearestDistance = tempDistance
                that.label.string = "得分者：" + item.name
            }

        })

    },


    // called every frame
    update: function (dt) {

        //判断是否重设游戏
        if (this.canReset) {
            if (this.isBallStatic()) {
              
                this.countScore()
                this.resetGame()
            }
        }
        //控制蓄力条
        if (this.isFoce) {
            this.foce(dt)
        }

        //控制摄像机
        if(this.player.y > 0){
            this.camera.enabled = true
            let targetPos = this.player.convertToWorldSpaceAR(cc.Vec2.ZERO)
            this.camera.node.y = this.node.convertToNodeSpaceAR(targetPos).y
    
        }
     

    },
})