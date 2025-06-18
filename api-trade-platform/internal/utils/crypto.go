package utils

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"io"

	"github.com/google/uuid"
)

// EncryptAPIKey 使用AES加密API密钥
func EncryptAPIKey(plaintext, key string) (string, error) {
	block, err := aes.NewCipher([]byte(key))
	if err != nil {
		return "", err
	}

	plaintextBytes := []byte(plaintext)
	ciphertext := make([]byte, aes.BlockSize+len(plaintextBytes))
	iv := ciphertext[:aes.BlockSize]

	if _, err := io.ReadFull(rand.Reader, iv); err != nil {
		return "", err
	}

	stream := cipher.NewCFBEncrypter(block, iv)
	stream.XORKeyStream(ciphertext[aes.BlockSize:], plaintextBytes)

	return base64.URLEncoding.EncodeToString(ciphertext), nil
}

// DecryptAPIKey 解密API密钥
func DecryptAPIKey(ciphertext, key string) (string, error) {
	ciphertextBytes, err := base64.URLEncoding.DecodeString(ciphertext)
	if err != nil {
		return "", err
	}

	block, err := aes.NewCipher([]byte(key))
	if err != nil {
		return "", err
	}

	if len(ciphertextBytes) < aes.BlockSize {
		return "", errors.New("ciphertext too short")
	}

	iv := ciphertextBytes[:aes.BlockSize]
	ciphertextBytes = ciphertextBytes[aes.BlockSize:]

	stream := cipher.NewCFBDecrypter(block, iv)
	stream.XORKeyStream(ciphertextBytes, ciphertextBytes)

	return string(ciphertextBytes), nil
}

// GeneratePlatformAPIKey 生成平台API密钥
func GeneratePlatformAPIKey() string {
	return "pak_" + uuid.New().String()
}

// GenerateServiceProxyPrefix 生成服务代理前缀
func GenerateServiceProxyPrefix(serviceName string) string {
	return "/proxy/v1/" + uuid.New().String()[:8] + "-" + serviceName
}