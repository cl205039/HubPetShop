// ============================================================
// CONFIGURAÇÃO DA API — altere aqui se o IP ou a porta do
// servidor da API mudarem. É o único lugar do projeto onde o
// endereço fica escrito — todo o resto usa `ApiConfig.baseUrl`.
// ============================================================

class ApiConfig {
  ApiConfig._();

  /// Endereço do servidor da API na rede local.
  /// Ex.: se a API rodar em outra máquina/IP, troque só a linha abaixo.
  static const String baseUrl = 'http://192.168.1.114/API/api/';
}