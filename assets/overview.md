# Review Code

Automatiza revisões de código em Pull Requests do Azure DevOps usando OpenAI ou Azure OpenAI. Analisa código, detecta bugs, verifica performance, boas práticas, Clean Code, desacoplamento e violações de SOLID. Os comentários são gerados em português brasileiro diretamente no Pull Request.

Requer chave de API da OpenAI ou Azure OpenAI e permissão "Contribute to pull requests" para Build Administrators no Azure DevOps. Configure um Variable Group com as credenciais e adicione a task ReviewCode no pipeline YAML do projeto.