
import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:http/http.dart' as http;

import 'api_config.dart';

class ApiException implements Exception {
  final String mensagem;
  final int? statusCode;
  final String? codigo;

  ApiException(this.mensagem, {this.statusCode, this.codigo});

  @override
  String toString() => mensagem;
}

class ApiClient {
  ApiClient._();

  static const Duration _timeout = Duration(seconds: 10);
  static const Map<String, String> _headers = {
    'Content-Type': 'application/json; charset=utf-8',
  };

  static Uri _uri(String caminho, [Map<String, dynamic>? query]) {
    final semBarraInicial =
        caminho.startsWith('/') ? caminho.substring(1) : caminho;
    final base = Uri.parse(ApiConfig.baseUrl);
    return base.replace(
      path: '${base.path}/$semBarraInicial'.replaceAll('//', '/'),
      queryParameters: (query == null || query.isEmpty)
          ? null
          : query.map((k, v) => MapEntry(k, v.toString())),
    );
  }

  static String _jsonAscii(Object? valor) {
    final texto = jsonEncode(valor);
    final sb = StringBuffer();
    for (final rune in texto.runes) {
      if (rune < 0x80) {
        sb.writeCharCode(rune);
      } else if (rune <= 0xFFFF) {
        sb.write('\\u${rune.toRadixString(16).padLeft(4, '0')}');
      } else {
        final v = rune - 0x10000;
        final hi = 0xD800 + (v >> 10);
        final lo = 0xDC00 + (v & 0x3FF);
        sb.write('\\u${hi.toRadixString(16).padLeft(4, '0')}');
        sb.write('\\u${lo.toRadixString(16).padLeft(4, '0')}');
      }
    }
    return sb.toString();
  }

  static Future<dynamic> get(String caminho, {Map<String, dynamic>? query}) {
    return _executar(() => http.get(_uri(caminho, query), headers: _headers));
  }

  static Future<dynamic> post(String caminho, Map<String, dynamic> corpo) {
    return _executar(() => http.post(
          _uri(caminho),
          headers: _headers,
          body: _jsonAscii(corpo),
        ));
  }

  static Future<dynamic> put(String caminho, Map<String, dynamic> corpo) {
    return _executar(() => http.put(
          _uri(caminho),
          headers: _headers,
          body: _jsonAscii(corpo),
        ));
  }

  static Future<dynamic> delete(String caminho) {
    return _executar(() => http.delete(_uri(caminho), headers: _headers));
  }

  static Future<dynamic> _executar(
    Future<http.Response> Function() chamada,
  ) async {
    http.Response resposta;
    try {
      resposta = await chamada().timeout(_timeout);
    } on TimeoutException {
      throw ApiException(
        'O servidor demorou demais para responder. Tente novamente.',
      );
    } on SocketException {
      throw ApiException(
        'Não foi possível conectar à API. Verifique o IP em '
        'lib/api_config.dart e se o servidor está ligado na rede.',
      );
    } on http.ClientException {
      throw ApiException(
        'Não foi possível conectar à API. Verifique o IP em '
        'lib/api_config.dart e se o servidor está ligado na rede.',
      );
    } catch (_) {
      throw ApiException('Falha inesperada ao falar com o servidor.');
    }

    if (resposta.statusCode == 204 || resposta.bodyBytes.isEmpty) {
      if (resposta.statusCode >= 200 && resposta.statusCode < 300) {
        return null;
      }
      throw ApiException('Erro no servidor (${resposta.statusCode}).',
          statusCode: resposta.statusCode);
    }

    dynamic corpo;
    try {
      corpo = jsonDecode(utf8.decode(resposta.bodyBytes));
    } on FormatException {
      throw ApiException('Resposta inválida do servidor.',
          statusCode: resposta.statusCode);
    }

    if (resposta.statusCode >= 200 && resposta.statusCode < 300) {
      return corpo;
    }

    final mapa = corpo is Map<String, dynamic> ? corpo : null;
    throw ApiException(
      (mapa?['mensagem'] as String?) ??
          'Erro no servidor (${resposta.statusCode}).',
      statusCode: resposta.statusCode,
      codigo: mapa?['erro'] as String?,
    );
  }
}
