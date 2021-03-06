const Generator = require('yeoman-generator');
const shell = require('shelljs');
const fs = require('fs');
const path = require('path');
const questions = require('./questions');

// 所有操作，均在用户执行 yo air 的目录下
module.exports = class extends Generator {
  // 必需的 constructor
  constructor(args, opts) {
    // 必需的 super
    super(args, opts);
    // 指定脚手架模板目录
    this.sourceRoot(path.resolve(__dirname, '../'));
  }

  /* 私有函数 */
  _fileCopy() {
    // 模板项目所有文件复制
    this._normalFileCopy();
    // .开头的配置文件复制（.editorconfig、.eslintrc、.gitignore）
    this._configFileCopy();
    // package.json 生成
    this._packageJsonCopy();
  }

  // 脚手架模板，普通文件及文件夹复制
  _normalFileCopy() {
    // 复制模板文件夹下的内容，到目标文件夹（注：这里无法复制.开头的文件。如.eslintrc）
    this.fs.copyTpl(
      this.templatePath(),
      // 将模板文件夹下的所有内容，复制到 `${this.destinationRoot}/${this.answers.projectName}` 文件夹
      this.destinationPath(this.answers.projectName),
      // 输出给模板的参数
      this.answers
    );
  }

  // .开头的文件复制（模板脚手架中，对.开头文件进行特殊处理，以_开头，以确保可以成功复制）
  _configFileCopy() {
    const files = fs.readdirSync(this.templatePath('templates'));
    // 将configs下以_开头的配置文件逐个格式化成以.开头
    files.forEach((file) => {
      const formatFile = file.replace('_', '.');
      this.fs.copyTpl(
        this.templatePath(`templates/${file}`),
        this.destinationPath(`${this.answers.projectName}/${formatFile}`)
      );
    });
  }

  // package.json 生成
  _packageJsonCopy() {
    const { projectName } = this.answers;
    const pkgJson = {
      name: projectName,
    };
    // this.destinationPath 指定要写入 pkgJson 的目标 package.json
    this.fs.extendJSON(
      this.destinationPath(`${projectName}/package.json`),
      pkgJson
    );
  }

  _foldersDelete() {
    const projectPath = `${this.destinationRoot()}/${this.answers.projectName}`;
    shell.rm('-rf', `${projectPath}/templates`);
    shell.rm('-rf', `${projectPath}/generator`);
  }

  /* 生命周期函数 执行顺序，如下注释所示 */
  // No2
  async prompting() {
    this.answers = await this.prompt(questions);
  }
  // No5
  async writing() {
    const { projectName } = this.answers;
    const isExists = fs.existsSync(`${this.destinationRoot()}/${projectName}`);
    // 如果用户当前目录下，已存在同名项目
    if (isExists) {
      const answer = await this.prompt({
        type: 'confirm',
        name: 'isReCreate',
        message: '即将创建的项目名称已存在，是否要覆盖已有项目？',
      });
      if (answer.isReCreate) {
        shell.rm('-rf', `${this.destinationRoot()}/${projectName}`);
        this._fileCopy();
      } else {
        this.log('\n' + '结束创建。' + '\n');
        shell.exit(1);
      }
    } else {
      this._fileCopy();
    }
  }

  // No7
  async install() {
    const answer = await this.prompt([
      {
        type: 'confirm',
        name: 'isInstall',
        message: '项目已生成，是否现在安装依赖包？',
        default: true,
      },
    ]);
    if (answer.isInstall) {
      this.log('即将为您安装项目依赖包，请稍候几秒钟哦~😉'.yellow);
      // 进入刚刚创建的脚手架目录
      shell.cd(`${this.destinationRoot()}/${this.answers.projectName}`);
      // 检查是否安装了yarn
      if (shell.which('yarn')) {
        // 执行npm包安装
        this.yarnInstall();
      } else if (shell.which('npm')) {
        this.npmInstall();
      }
    }
  }

  // No8
  end() {
    this._foldersDelete();
    this.log(
      '\n' + 'Congratulations! Component created successfully ~ '.green + '\n'
    );
  }
};
