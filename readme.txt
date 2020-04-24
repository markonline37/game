Google Chrome web browser is the intended target audience, it may work in other web browsers or cause errors.

In order to start the application: 

1. Redis-server needs to be running
2. Open a command prompt or powershell window in the version folder.
3. Type "npm start" and hit enter.
4. In Google's Chrome go to http://localhost:5000
5. Create a new user, the email must be in a valid form but does not have to be a real email e.g. "0@madeupemail.com"
6. Move around using W, A, S, D keys and E key to interact. You can fish in water, or interact with the vendor and bank.

Redis-server was installed through ubuntu installed on the windows subsystem for linux (WSL).

If you are on windows 10 and want to install redis through ubuntu:

	If you need to enable WSL, open powershell as administrator and enter the following command:

		Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Windows-Subsystem-Linux

	You will then need to restart the computer.

	In the microsoft store (windows application) search for Ubuntu, download and install.

	Ubuntu now appears as a normal program in the windows program list, start ubuntu.

	You will need to now configure a user and password in ubuntu.

	Then enter the command into ubuntu to install redis-server:

		sudo apt-get install redis-server

	Once the installation is complete enter the following command to start redis:

		redis-server

	redis-server can be configured to run as a daemon (background process) with:

		redis-server --daemonize yes

	Or as a service which starts when ubuntu is launched:

		sudo systemctl enable redis-server.service

If you want to launch the test, start a seperate command prompt or powershell window and type:
	
	artillery run test.yml