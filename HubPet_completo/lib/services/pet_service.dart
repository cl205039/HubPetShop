import '../api_client.dart';
import '../models/pet.dart';

class PetService {
  PetService._();

  static Future<List<Pet>> listar(int usuarioId) async {
    final json = await ApiClient.get('usuarios/$usuarioId/pets');
    return (json as List)
        .map((e) => Pet.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  static Future<Pet> cadastrar(int usuarioId, Pet pet) async {
    final json =
        await ApiClient.post('usuarios/$usuarioId/pets', pet.toJson());
    return Pet.fromJson(json as Map<String, dynamic>);
  }

  static Future<Pet> atualizar(Pet pet) async {
    final json = await ApiClient.put('pets/${pet.id}', pet.toJson());
    return Pet.fromJson(json as Map<String, dynamic>);
  }

  static Future<void> remover(int id) {
    return ApiClient.delete('pets/$id');
  }
}
