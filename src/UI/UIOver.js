/****************************************
 * 结束界面模块
 ****************************************/
var UIOver = Class(Layer,
{
	/**
	 * 构造函数 - 创建结束界面
	 */
	UIOver: function()
	{
		this.Layer();		// super


		//
		// Game Over图片
		//
		var spt = new Sprite("res/UI.png", 376, 160);
		spt.SetFrame(1);
		spt.Move(132, 144);

		this.Append(spt);
	},


	OnEnter: function()
	{
		this.Show();
	},


	OnLeave: function()
	{
		this.Hide();
	},


	OnUpdate: function(T)
	{
		if(T < 100)
		{
			//
			// 显示Game Over
			//	 按START可以跳过
			//
			if(Input.IsPressed(InputAction.START))
				T = 99;
		}
		else if(T == 100)
		{
			//
			// 破记录
			//
			if(App.Game.ScoreHi < App.Game.Score)
			{
				App.Game.ScoreHi = App.Game.Score;

				// ...
			}

			// 开场界面分数
			App.OpenUI.DispScore();

			// 清空地图
			App.Scene.ClearMap();

			// 游戏结束后清理工作
			App.Game.Reset();

			// 玩家等级清零
			App.Scene.Tanks[0].SetType(0);

			// 回到初始状态
			App.GameUI.SetBG("#000");

			return App.MyApp.Go(App.OpenUI);
		}

		return T;
	}
});