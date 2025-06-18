package config

import (
	"github.com/spf13/viper"
)

// Config 存储所有应用程序的配置
// viper 标签用于指定环境变量的名称
type Config struct {
	DB_HOST     string `mapstructure:"DB_HOST"`
	DB_PORT     string `mapstructure:"DB_PORT"`
	DB_USER     string `mapstructure:"DB_USER"`
	DB_PASSWORD string `mapstructure:"DB_PASSWORD"`
	DB_NAME     string `mapstructure:"DB_NAME"`
	DB_SSLMODE  string `mapstructure:"DB_SSLMODE"`

	API_SERVER_PORT string `mapstructure:"API_SERVER_PORT"`

	JWT_SECRET_KEY        string `mapstructure:"JWT_SECRET_KEY"`
	JWT_EXPIRATION_HOURS  int    `mapstructure:"JWT_EXPIRATION_HOURS"`

	ENCRYPTION_KEY string `mapstructure:"ENCRYPTION_KEY"`

	// Redis Configuration
	REDIS_HOST      string `mapstructure:"REDIS_HOST"`
	REDIS_PORT      string `mapstructure:"REDIS_PORT"`
	REDIS_PASSWORD  string `mapstructure:"REDIS_PASSWORD"`
	REDIS_DB        int    `mapstructure:"REDIS_DB"`
	REDIS_POOL_SIZE int    `mapstructure:"REDIS_POOL_SIZE"`
}

// LoadConfig 从指定路径的 .env 文件或环境变量中读取配置
func LoadConfig(path string) (config Config, err error) {
	viper.AddConfigPath(path)       // .env 文件所在的路径
	viper.SetConfigName(".env")     // .env 文件的名称 (不带扩展名)
	viper.SetConfigType("env")      // .env 文件的类型

	viper.AutomaticEnv() // 自动从环境变量中读取匹配的键

	if err = viper.ReadInConfig(); err != nil {
		// 如果 .env 文件不存在，可以忽略错误，因为可能直接使用环境变量
		if _, ok := err.(viper.ConfigFileNotFoundError); !ok {
			return
		}
	}

	err = viper.Unmarshal(&config)
	return
}